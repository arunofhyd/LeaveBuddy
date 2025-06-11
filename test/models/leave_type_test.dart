import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:leave_buddy/models/leave_type.dart'; // Adjust import path as needed

void main() {
  group('LeaveType Model', () {
    test('Constructor initializes fields correctly with default used value', () {
      final leaveType = LeaveType(name: 'Annual', count: 20, color: Colors.blue);
      expect(leaveType.name, 'Annual');
      expect(leaveType.count, 20);
      expect(leaveType.color, Colors.blue);
      expect(leaveType.used, 0.0); // Default value
    });

    test('Constructor initializes fields correctly with provided used value', () {
      final leaveType = LeaveType(name: 'Sick', count: 10, color: Colors.red, used: 2.5);
      expect(leaveType.name, 'Sick');
      expect(leaveType.count, 10);
      expect(leaveType.color, Colors.red);
      expect(leaveType.used, 2.5);
    });

    test('Used value can be updated', () {
      final leaveType = LeaveType(name: 'Vacation', count: 15, color: Colors.green);
      expect(leaveType.used, 0.0);
      leaveType.used = 5.0;
      expect(leaveType.used, 5.0);
    });
  });
}
