import numpy as np
import pytest
from unittest.mock import MagicMock
from thompson import calculate_thompson_weights


def make_variants(data):
    """Helper to create mock variant objects with .variant_id, .exposures, .conversions"""
    variants = []
    for d in data:
        v = MagicMock()
        v.variant_id = d["variant_id"]
        v.exposures = d["exposures"]
        v.conversions = d["conversions"]
        variants.append(v)
    return variants


class TestThompsonSampling:
    def test_weights_sum_to_100(self):
        np.random.seed(42)
        variants = make_variants([
            {"variant_id": 1, "exposures": 100, "conversions": 10},
            {"variant_id": 2, "exposures": 100, "conversions": 20},
            {"variant_id": 3, "exposures": 100, "conversions": 15},
        ])
        weights = calculate_thompson_weights(variants)
        assert sum(weights.values()) == 100

    def test_returns_all_variant_ids(self):
        np.random.seed(42)
        variants = make_variants([
            {"variant_id": 10, "exposures": 50, "conversions": 5},
            {"variant_id": 20, "exposures": 50, "conversions": 10},
        ])
        weights = calculate_thompson_weights(variants)
        assert set(weights.keys()) == {10, 20}

    def test_better_variant_gets_more_weight(self):
        np.random.seed(42)
        variants = make_variants([
            {"variant_id": 1, "exposures": 1000, "conversions": 50},
            {"variant_id": 2, "exposures": 1000, "conversions": 200},
        ])
        weights = calculate_thompson_weights(variants)
        assert weights[2] > weights[1], (
            f"Variant 2 (20% CR) should get more weight than Variant 1 (5% CR), "
            f"got {weights[2]} vs {weights[1]}"
        )

    def test_zero_exposures(self):
        np.random.seed(42)
        variants = make_variants([
            {"variant_id": 1, "exposures": 0, "conversions": 0},
            {"variant_id": 2, "exposures": 0, "conversions": 0},
        ])
        weights = calculate_thompson_weights(variants)
        assert sum(weights.values()) == 100
        # With no data, prior is uniform Beta(1,1) so weights should be roughly equal
        assert abs(weights[1] - weights[2]) < 20

    def test_empty_variants(self):
        weights = calculate_thompson_weights([])
        assert weights == {}

    def test_single_variant(self):
        np.random.seed(42)
        variants = make_variants([
            {"variant_id": 1, "exposures": 100, "conversions": 10},
        ])
        weights = calculate_thompson_weights(variants)
        assert weights[1] == 100

    def test_weights_are_integers(self):
        np.random.seed(42)
        variants = make_variants([
            {"variant_id": 1, "exposures": 100, "conversions": 10},
            {"variant_id": 2, "exposures": 100, "conversions": 20},
            {"variant_id": 3, "exposures": 100, "conversions": 30},
        ])
        weights = calculate_thompson_weights(variants)
        for w in weights.values():
            assert isinstance(w, int)

    def test_deterministic_with_seed(self):
        np.random.seed(123)
        variants = make_variants([
            {"variant_id": 1, "exposures": 500, "conversions": 50},
            {"variant_id": 2, "exposures": 500, "conversions": 100},
        ])
        weights_a = calculate_thompson_weights(variants)

        np.random.seed(123)
        variants = make_variants([
            {"variant_id": 1, "exposures": 500, "conversions": 50},
            {"variant_id": 2, "exposures": 500, "conversions": 100},
        ])
        weights_b = calculate_thompson_weights(variants)

        assert weights_a == weights_b
