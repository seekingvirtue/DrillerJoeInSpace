/**
 * Simple Unit Test Framework
 * No dependencies - runs directly in browser
 */
class UnitTest {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    // Define a test
    test(description, testFunction) {
        this.tests.push({
            description,
            testFunction
        });
    }

    // Assertion methods
    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
        }
    }

    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`Expected true, got ${value}. ${message}`);
        }
    }

    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`Expected false, got ${value}. ${message}`);
        }
    }

    assertThrows(func, message = '') {
        try {
            func();
            throw new Error(`Expected function to throw an error. ${message}`);
        } catch (e) {
            // Expected behavior
        }
    }

    assertNotNull(value, message = '') {
        if (value === null || value === undefined) {
            throw new Error(`Expected non-null value, got ${value}. ${message}`);
        }
    }

    // Run all tests
    async run() {
        console.log('🚀 Running Driller Joe In Space Unit Tests...\n');
        
        this.results = { passed: 0, failed: 0, total: 0 };
        
        for (let test of this.tests) {
            try {
                await test.testFunction();
                console.log(`✅ PASS: ${test.description}`);
                this.results.passed++;
            } catch (error) {
                console.log(`❌ FAIL: ${test.description}`);
                console.log(`   Error: ${error.message}`);
                this.results.failed++;
            }
            this.results.total++;
        }
        
        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log(`📊 TEST SUMMARY`);
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        
        if (this.results.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log(`⚠️  ${this.results.failed} test(s) failed`);
        }
        console.log('='.repeat(50));
    }
}

// Global test instance
window.unitTest = new UnitTest();
