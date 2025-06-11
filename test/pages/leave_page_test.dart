import 'package:flutter_test/flutter_test.dart';
import 'package:leave_buddy/pages/leave_page.dart'; // Adjust import path

// Temporary class to expose the method for testing
class TestLeavePageState extends LeavePageState {
  @override
  Widget build(BuildContext context) {
    // This build method won't be used in tests for validateLeaveCount
    throw UnimplementedError();
  }

  // Expose the method for testing
  double testValidateLeaveCount(double value) {
    return super.validateLeaveCount(value);
  }
}

void main() {
  group('LeavePage - validateLeaveCount', () {
    final pageState = TestLeavePageState();

    test('should correctly validate whole numbers', () {
      expect(pageState.testValidateLeaveCount(1.0), 1.0);
      expect(pageState.testValidateLeaveCount(5.0), 5.0);
    });

    test('should correctly validate numbers ending in .00', () {
      expect(pageState.testValidateLeaveCount(1.00), 1.0);
      expect(pageState.testValidateLeaveCount(5.00), 5.0);
    });

    test('should correctly validate numbers ending in .25', () {
      expect(pageState.testValidateLeaveCount(1.25), 1.25);
      expect(pageState.testValidateLeaveCount(3.75), 3.75);
    });

    test('should correctly validate numbers ending in .5 or .50', () {
      expect(pageState.testValidateLeaveCount(1.5), 1.5);
      expect(pageState.testValidateLeaveCount(2.50), 2.5);
    });

    test('should correctly validate numbers ending in .75', () {
      expect(pageState.testValidateLeaveCount(0.75), 0.75);
      expect(pageState.testValidateLeaveCount(4.75), 4.75);
    });

    test('should round numbers to the nearest 0.25 increment', () {
      // Rounds down
      expect(pageState.testValidateLeaveCount(1.1), 1.0); // Rounds to 1.00
      expect(pageState.testValidateLeaveCount(1.12), 1.0); // Rounds to 1.00, (1.12 * 4 = 4.48 -> round(4.48) = 4 -> 4/4 = 1.0)
      expect(pageState.testValidateLeaveCount(2.3), 2.25); // Rounds to 2.25 (2.3 * 4 = 9.2 -> round(9.2) = 9 -> 9/4 = 2.25)
      expect(pageState.testValidateLeaveCount(2.37), 2.25); // Rounds to 2.25 (2.37 * 4 = 9.48 -> round(9.48) = 9 -> 9/4 = 2.25)


      // Rounds up
      expect(pageState.testValidateLeaveCount(1.13), 1.25); // Rounds to 1.25 (1.13 * 4 = 4.52 -> round(4.52) = 5 -> 5/4 = 1.25)
      expect(pageState.testValidateLeaveCount(1.20), 1.25); // Rounds to 1.25
      expect(pageState.testValidateLeaveCount(2.4), 2.5);  // Rounds to 2.50 (2.4 * 4 = 9.6 -> round(9.6) = 10 -> 10/4 = 2.5)
      expect(pageState.testValidateLeaveCount(2.6), 2.5); // Rounds to 2.50 (2.6 * 4 = 10.4 -> round(10.4) = 10 -> 10/4 = 2.5)
      expect(pageState.testValidateLeaveCount(2.63), 2.75); // Rounds to 2.75 (2.63*4 = 10.52 -> round(10.52) = 11 -> 11/4 = 2.75)
      expect(pageState.testValidateLeaveCount(3.88), 4.00); // Rounds to 4.00 (3.88*4 = 15.52 -> round(15.52) = 16 -> 16/4 = 4.00)
      expect(pageState.testValidateLeaveCount(3.90), 4.00); // Rounds to 4.00
    });

    test('should handle zero correctly', () {
      expect(pageState.testValidateLeaveCount(0.0), 0.0);
    });

    test('should handle negative numbers (rounding behavior)', () {
      // The function's rounding should still apply
      expect(pageState.testValidateLeaveCount(-1.0), -1.0);
      expect(pageState.testValidateLeaveCount(-1.1), -1.0); // (-1.1 * 4 = -4.4 -> round(-4.4) = -4 -> -4/4 = -1.0)
      expect(pageState.testValidateLeaveCount(-1.13), -1.25); // (-1.13 * 4 = -4.52 -> round(-4.52) = -5 -> -5/4 = -1.25)
      expect(pageState.testValidateLeaveCount(-1.25), -1.25);
      expect(pageState.testValidateLeaveCount(-1.4), -1.5); // (-1.4 * 4 = -5.6 -> round(-5.6) = -6 -> -6/4 = -1.5)
    });
  });
}
