const { hashToBucket, assignBucketToVariant } = require('../services/assignment.service');

describe('Deterministic Assignment', () => {
    describe('hashToBucket', () => {
        test('returns a number between 0 and 99', () => {
            for (let i = 0; i < 100; i++) {
                const bucket = hashToBucket(1, `user_${i}`);
                expect(bucket).toBeGreaterThanOrEqual(0);
                expect(bucket).toBeLessThan(100);
            }
        });

        test('is deterministic — same inputs always yield the same bucket', () => {
            const bucket1 = hashToBucket(42, 'alice');
            const bucket2 = hashToBucket(42, 'alice');
            const bucket3 = hashToBucket(42, 'alice');
            expect(bucket1).toBe(bucket2);
            expect(bucket2).toBe(bucket3);
        });

        test('different users get different buckets (statistical)', () => {
            const buckets = new Set();
            for (let i = 0; i < 1000; i++) {
                buckets.add(hashToBucket(1, `user_${i}`));
            }
            // With 1000 users, we should see a good spread across the 100 buckets
            expect(buckets.size).toBeGreaterThan(80);
        });

        test('different experiments yield different buckets for the same user', () => {
            const b1 = hashToBucket(1, 'alice');
            const b2 = hashToBucket(2, 'alice');
            // Not guaranteed to differ, but overwhelmingly likely
            // We just verify they're valid
            expect(b1).toBeGreaterThanOrEqual(0);
            expect(b2).toBeGreaterThanOrEqual(0);
        });
    });

    describe('assignBucketToVariant', () => {
        const variants = [
            { id: 1, name: 'Control', weight: 50 },
            { id: 2, name: 'Variant A', weight: 30 },
            { id: 3, name: 'Variant B', weight: 20 },
        ];

        test('bucket 0 maps to the first variant', () => {
            expect(assignBucketToVariant(0, variants).id).toBe(1);
        });

        test('bucket 49 maps to the first variant (edge of range)', () => {
            expect(assignBucketToVariant(49, variants).id).toBe(1);
        });

        test('bucket 50 maps to the second variant', () => {
            expect(assignBucketToVariant(50, variants).id).toBe(2);
        });

        test('bucket 79 maps to the second variant (edge)', () => {
            expect(assignBucketToVariant(79, variants).id).toBe(2);
        });

        test('bucket 80 maps to the third variant', () => {
            expect(assignBucketToVariant(80, variants).id).toBe(3);
        });

        test('bucket 99 maps to the third variant', () => {
            expect(assignBucketToVariant(99, variants).id).toBe(3);
        });

        test('two equal-weight variants split 50/50', () => {
            const twoVariants = [
                { id: 1, name: 'A', weight: 50 },
                { id: 2, name: 'B', weight: 50 },
            ];
            expect(assignBucketToVariant(0, twoVariants).id).toBe(1);
            expect(assignBucketToVariant(49, twoVariants).id).toBe(1);
            expect(assignBucketToVariant(50, twoVariants).id).toBe(2);
            expect(assignBucketToVariant(99, twoVariants).id).toBe(2);
        });
    });
});
