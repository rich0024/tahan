import 'package:flutter/material.dart';

import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Firebase.initializeApp() belongs here once T1.1's registration is done.
  runApp(const TahanApp());
}
