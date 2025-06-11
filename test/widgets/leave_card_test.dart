import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:leave_buddy/models/leave_type.dart'; // Adjust import
import 'package:leave_buddy/pages/leave_page.dart'; // For LeaveCard, adjust import if moved

// Mock callback functions
class MockCallbacks {
  int incrementCalled = 0;
  int decrementCalled = 0;
  int editNameCalled = 0;
  int deleteCalled = 0;
  int editTotalCountCalled = 0;

  void onIncrementUsed() => incrementCalled++;
  void onDecrementUsed() => decrementCalled++;
  void onEditName() => editNameCalled++;
  void onDelete() => deleteCalled++;
  void onEditTotalCount() => editTotalCountCalled++;

  void reset() {
    incrementCalled = 0;
    decrementCalled = 0;
    editNameCalled = 0;
    deleteCalled = 0;
    editTotalCountCalled = 0;
  }
}

void main() {
  group('LeaveCard Widget Tests', () {
    late LeaveType leave;
    late MockCallbacks mockCallbacks;

    setUp(() {
      leave = LeaveType(name: 'Test Leave', count: 10.0, color: Colors.blue, used: 2.0);
      mockCallbacks = MockCallbacks();
    });

    Widget buildTestableWidget(LeaveType currentLeave) {
      return MaterialApp(
        home: Scaffold(
          body: LeaveCard(
            leave: currentLeave,
            isEditing: false,
            isModifying: false,
            onEditName: mockCallbacks.onEditName,
            onDelete: mockCallbacks.onDelete,
            onEditTotalCount: mockCallbacks.onEditTotalCount,
            onIncrementUsed: mockCallbacks.onIncrementUsed,
            onDecrementUsed: mockCallbacks.onDecrementUsed,
          ),
        ),
      );
    }

    testWidgets('Displays leave name, total, used, and remaining correctly', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestableWidget(leave));

      expect(find.text('Test Leave'), findsOneWidget);
      expect(find.text('Total: 10.00'), findsOneWidget);
      expect(find.text('Used: 2.00'), findsOneWidget);
      expect(find.text('Remaining: 8.00'), findsOneWidget); // 10.0 - 2.0 = 8.0
    });

    testWidgets('Increment button calls onIncrementUsed callback', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestableWidget(leave));

      await tester.tap(find.byIcon(Icons.add_circle_outline));
      await tester.pump();

      expect(mockCallbacks.incrementCalled, 1);
      expect(mockCallbacks.decrementCalled, 0);
    });

    testWidgets('Decrement button calls onDecrementUsed callback', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestableWidget(leave));

      await tester.tap(find.byIcon(Icons.remove_circle_outline));
      await tester.pump();

      expect(mockCallbacks.decrementCalled, 1);
      expect(mockCallbacks.incrementCalled, 0);
    });

    testWidgets('Decrement button is disabled when used is 0', (WidgetTester tester) async {
      leave.used = 0.0;
      await tester.pumpWidget(buildTestableWidget(leave));

      // Verify text for remaining
      expect(find.text('Remaining: 10.00'), findsOneWidget);

      // Find the IconButton for decrementing
      final Finder decrementButtonFinder = find.widgetWithIcon(IconButton, Icons.remove_circle_outline);
      final IconButton decrementButton = tester.widget(decrementButtonFinder);

      // Check if onPressed is null, indicating it's disabled
      expect(decrementButton.onPressed, isNull);

      // Attempt to tap, should not call callback
      await tester.tap(decrementButtonFinder);
      await tester.pump();
      expect(mockCallbacks.decrementCalled, 0);
    });

    testWidgets('Increment button is disabled when used equals count', (WidgetTester tester) async {
      leave.used = 10.0;
      await tester.pumpWidget(buildTestableWidget(leave));

      // Verify text for remaining
      expect(find.text('Remaining: 0.00'), findsOneWidget);

      final Finder incrementButtonFinder = find.widgetWithIcon(IconButton, Icons.add_circle_outline);
      final IconButton incrementButton = tester.widget(incrementButtonFinder);

      expect(incrementButton.onPressed, isNull);

      await tester.tap(incrementButtonFinder);
      await tester.pump();
      expect(mockCallbacks.incrementCalled, 0);
    });

     testWidgets('Increment button is enabled when used is less than count', (WidgetTester tester) async {
      leave.used = 9.5; // Less than count (10.0)
      await tester.pumpWidget(buildTestableWidget(leave));

      final Finder incrementButtonFinder = find.widgetWithIcon(IconButton, Icons.add_circle_outline);
      final IconButton incrementButton = tester.widget(incrementButtonFinder);

      expect(incrementButton.onPressed, isNotNull);

      await tester.tap(incrementButtonFinder);
      await tester.pump();
      expect(mockCallbacks.incrementCalled, 1);
    });

    testWidgets('Decrement button is enabled when used is greater than 0', (WidgetTester tester) async {
      leave.used = 0.5; // Greater than 0
      await tester.pumpWidget(buildTestableWidget(leave));

      final Finder decrementButtonFinder = find.widgetWithIcon(IconButton, Icons.remove_circle_outline);
      final IconButton decrementButton = tester.widget(decrementButtonFinder);

      expect(decrementButton.onPressed, isNotNull);

      await tester.tap(decrementButtonFinder);
      await tester.pump();
      expect(mockCallbacks.decrementCalled, 1);
    });

    testWidgets('Editing controls (name, total count) are testable if needed', (WidgetTester tester) async {
      // Example for isEditing name (though LeaveCard itself doesn't show a dialog)
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: LeaveCard(
            leave: leave,
            isEditing: true, // Enable editing mode
            isModifying: false,
            onEditName: mockCallbacks.onEditName,
            onDelete: mockCallbacks.onDelete,
            onEditTotalCount: mockCallbacks.onEditTotalCount,
            onIncrementUsed: mockCallbacks.onIncrementUsed,
            onDecrementUsed: mockCallbacks.onDecrementUsed,
          ),
        ),
      ));

      await tester.tap(find.text('Test Leave'));
      await tester.pump();
      expect(mockCallbacks.editNameCalled, 1);

      // Test for edit total count button
      await tester.tap(find.byIcon(Icons.edit));
      await tester.pump();
      expect(mockCallbacks.editTotalCountCalled, 1);
    });

    testWidgets('Delete button calls onDelete callback when isModifying is true', (WidgetTester tester) async {
        await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: LeaveCard(
            leave: leave,
            isEditing: true,
            isModifying: true, // Enable modifying mode for delete icon
            onEditName: mockCallbacks.onEditName,
            onDelete: mockCallbacks.onDelete,
            onEditTotalCount: mockCallbacks.onEditTotalCount,
            onIncrementUsed: mockCallbacks.onIncrementUsed,
            onDecrementUsed: mockCallbacks.onDecrementUsed,
          ),
        ),
      ));

      expect(find.byIcon(Icons.delete), findsOneWidget);
      await tester.tap(find.byIcon(Icons.delete));
      await tester.pump();
      expect(mockCallbacks.deleteCalled, 1);
    });


  });
}
