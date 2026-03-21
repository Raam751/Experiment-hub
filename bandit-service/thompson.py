import numpy as np
from scipy.stats import beta

def calculate_thompson_weights(variants):
    """
    Given a list of variants with their exposures and conversions,
    calculates the new traffic weights using Thompson Sampling (Beta distribution).

    variants = [
       {"variant_id": 1, "exposures": 100, "conversions": 10},
       ...
    ]

    Returns a dictionary mapping variant_id to an integer weight (0-100).
    The weights will sum to exactly 100.
    """
    n_variants = len(variants)
    if n_variants == 0:
        return {}

    # Number of Monte Carlo simulations to run
    n_simulations = 10000
    
    # Store the Beta distribution samples for each variant
    samples = np.zeros((n_variants, n_simulations))
    
    variant_ids = []
    
    for i, v in enumerate(variants):
        variant_ids.append(v.variant_id)
        
        # Beta distribution parameters: 
        # alpha = 1 + successes (conversions)
        # beta = 1 + failures (exposures - conversions)
        # We start with a completely uniform prior of Beta(1, 1).
        alpha = 1 + v.conversions
        beta_param = 1 + max(0, v.exposures - v.conversions)
        
        # Draw samples from the posterior Beta distribution
        samples[i] = beta.rvs(alpha, beta_param, size=n_simulations)

    # For each simulation, find which variant has the highest sampled conversion rate
    winners = np.argmax(samples, axis=0)
    
    # Count how many times each variant "won"
    win_counts = np.bincount(winners, minlength=n_variants)
    
    # Convert win counts to percentages (0-100)
    win_percentages = (win_counts / n_simulations) * 100
    
    # Round to integers while making sure they sum to exactly 100
    # The Largest Remainder Method is commonly used here to avoid rounding errors (e.g. 33+33+33 = 99)
    weights = np.floor(win_percentages).astype(int)
    remainders = win_percentages - weights
    
    shortfall = 100 - np.sum(weights)
    if shortfall > 0:
        # Give the extra 1%s to the variants with the highest fractional remainders
        indices = np.argsort(remainders)[-shortfall:]
        weights[indices] += 1
        
    result = {}
    for i, v_id in enumerate(variant_ids):
        result[v_id] = int(weights[i])
        
    return result
