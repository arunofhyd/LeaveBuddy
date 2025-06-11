import 'package:flutter/material.dart';

class LeaveType {
  String name;
  double count;
  Color color;
  double used;

  LeaveType({required this.name, required this.count, required this.color, this.used = 0.0});
}