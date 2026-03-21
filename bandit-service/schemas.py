from pydantic import BaseModel
from typing import List

class VariantMetrics(BaseModel):
    variant_id: int
    exposures: int
    conversions: int

class OptimizeRequest(BaseModel):
    experiment_id: int
    variants: List[VariantMetrics]

class VariantWeightInfo(BaseModel):
    variant_id: int
    new_weight: int

class OptimizeResponse(BaseModel):
    experiment_id: int
    updated_weights: List[VariantWeightInfo]
