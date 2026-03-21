from fastapi import FastAPI, HTTPException, Header, Depends
import os
import requests
from schemas import OptimizeRequest, OptimizeResponse, VariantWeightInfo
from thompson import calculate_thompson_weights

app = FastAPI(title="Bandit Optimization Service")

# Read config from environment (default to match Node service locally)
API_KEY = os.environ.get("BANDIT_API_KEY", "internal-service-key")
NODE_SERVICE_URL = os.environ.get("NODE_SERVICE_URL", "http://localhost:3000")

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return x_api_key

@app.post("/optimize", response_model=OptimizeResponse, dependencies=[Depends(verify_api_key)])
def optimize_experiment(request: OptimizeRequest):
    """
    1. Receives current variant metrics from the Node service
    2. Calculates new weights using Thompson Sampling
    3. Calls the Node service back to apply the new weights
    """
    if len(request.variants) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 variants to optimize")
        
    # Convert Pydantic models to dicts for our Thompson logic
    metrics_data = [
        {
            "variant_id": v.variant_id, 
            "exposures": v.exposures, 
            "conversions": v.conversions
        } 
        for v in request.variants
    ]
    
    # Calculate new optimal weights
    new_weights_dict = calculate_thompson_weights(request.variants)
    
    # Format the updated weights for the response
    updated_weights = [
        VariantWeightInfo(variant_id=vid, new_weight=weight)
        for vid, weight in new_weights_dict.items()
    ]
    
    # Call the Node.js service to actually update the weights in the database
    # Since this is service-to-service, we authenticate using our shared API key
    try:
        response = requests.patch(
            f"{NODE_SERVICE_URL}/internal/experiments/{request.experiment_id}/weights",
            json={"weights": new_weights_dict},
            headers={"X-API-Key": API_KEY}
        )
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else 500
        msg = e.response.text if e.response else str(e)
        raise HTTPException(status_code=status, detail=f"Failed to push weights to Node service: {msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return OptimizeResponse(
        experiment_id=request.experiment_id,
        updated_weights=updated_weights
    )

@app.get("/health")
def health_check():
    return {"status": "ok"}
