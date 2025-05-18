import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:geocoding/geocoding.dart';

import 'welcome_page.dart';
import 'login_page.dart';
import 'signup_page.dart';
import 'home_page.dart';
import 'profile_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  await LocationService.initialize();

  runApp(MyApp());
}



class LocationService {
  static Position? _currentPosition;
  static String? _currentCity;
  static String? _currentCountry;

  static Position? get currentPosition => _currentPosition;
  static String? get currentCity => _currentCity;
  static String? get currentCountry => _currentCountry;

  static Future<void> initialize() async {
    await _requestPermission();
    await _getCurrentPosition();
  }

  static Future<void> _requestPermission() async {
    final status = await Permission.location.status;
    if (!status.isGranted) {
      final result = await Permission.location.request();
      if (!result.isGranted) {
        print('Location permission denied');
      }
    }
  }

  static Future<void> _getCurrentPosition() async {
    try {
      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      print('Location obtained: Lat=${_currentPosition?.latitude}, Lon=${_currentPosition?.longitude}');

      if (_currentPosition != null) {
        List<Placemark> placemarks = await placemarkFromCoordinates(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
        );
        if (placemarks.isNotEmpty) {
          final place = placemarks.first;
          _currentCity = place.locality ?? 'Unknown City';
          _currentCountry = place.country ?? 'Unknown Country';
          print('Location resolved: City=$_currentCity, Country=$_currentCountry');
        }
      }
    } catch (e) {
      print('Error getting location: $e');
    }
  }
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VeriGlow',
      theme: ThemeData(
        primarySwatch: Colors.pink,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => WelcomePage(),
        '/login': (context) => LoginPage(),
        '/signup': (context) => SignUpPage(),
        '/home': (context) => HomePage(),
        '/profile': (context) => ProfilePage(),
      },
    );
  }
}
