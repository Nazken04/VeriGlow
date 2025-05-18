import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:cached_network_image/cached_network_image.dart';

import 'main.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  MobileScannerController cameraController = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
  );
  bool _isScanningMode = true;
  Map<String, dynamic>? _productDataFromBackend;
  String? _verificationMessage;

  final storage = FlutterSecureStorage();
  final String _baseNgrokUrl = 'https://2771-5-34-33-30.ngrok-free.app/';

  @override
  void initState() {
    super.initState();
  }

  Future<String?> _getAuthToken() async {
    return await storage.read(key: 'jwt_token');
  }

  Future<void> _fetchProductInfo(String qrCodeValue) async {
    final token = await _getAuthToken();
    if (!mounted) return;

    String locationString = 'Unknown';
    final city = LocationService.currentCity;
    final country = LocationService.currentCountry;

    if (city != null && country != null) {
      locationString = '$city, $country';
    } else if (city != null) {
      locationString = city;
    } else if (country != null) {
      locationString = country;
    }

    try {
      final response = await http.post(
        Uri.parse('$_baseNgrokUrl/api/products/verify'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'qr_code': qrCodeValue,
          'location': locationString,
        }),
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        setState(() {
          _productDataFromBackend = responseData['product'];
          _verificationMessage = responseData['message'];
          _isScanningMode = false;
        });
      } else {
        final errorData = json.decode(response.body);
        setState(() {
          _verificationMessage =
          'Failed: ${response.statusCode} - ${errorData['message'] ?? 'Unknown error'}';
          _productDataFromBackend = null;
          _isScanningMode = true;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(_verificationMessage ?? 'Failed to fetch product info')));
        }
        if (mounted && cameraController.value.isRunning == false) {
          try {
            await cameraController.start();
          } catch (e) {
            print("Error restarting camera (fetch fail): $e");
          }
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _verificationMessage = 'Error: $e';
        _productDataFromBackend = null;
        _isScanningMode = true;
      });
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('An error occurred: $e')));
      }
      if (mounted && cameraController.value.isRunning == false) {
        try {
          await cameraController.start();
        } catch (e) {
          print("Error restarting camera (exception): $e");
        }
      }
    }
  }

  void _handleBarcodeDetect(BarcodeCapture capture) {
    if (!_isScanningMode || !mounted) return;

    final Barcode barcode = capture.barcodes.first;
    if (barcode.rawValue != null && barcode.rawValue!.isNotEmpty) {
      cameraController.stop();
      _fetchProductInfo(barcode.rawValue!);
    }
  }

  void _resetToScanMode() {
    if (!mounted) return;
    setState(() {
      _productDataFromBackend = null;
      _verificationMessage = null;
      _isScanningMode = true;
    });

    if (mounted && cameraController.value.isRunning == false) {
      try {
        cameraController.start();
      } catch (e) {
        print("Error starting camera in _resetToScanMode: $e");
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Could not start camera. Please check permissions.')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFE5DFD9),
      body: Stack(
        children: [
          _isScanningMode ? _buildScannerUI(context) : _buildProductDetailsUI(context),
          _buildBottomNavigationBar(context),
        ],
      ),
    );
  }

  Widget _buildScannerUI(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    return Positioned.fill(
      child: Padding(
        padding: EdgeInsets.only(bottom: 98.0),
        child: Column(
          children: [
            SizedBox(height: MediaQuery.of(context).padding.top + 20),
            Text(
              'Veriglow QR',
              style: TextStyle(
                fontFamily: 'Aboreto',
                fontWeight: FontWeight.w400,
                fontSize: 30.0,
                color: Colors.black87,
              ),
            ),
            SizedBox(height: 20),
            GestureDetector(
              onTap: () {
                if (!mounted) return;
                if (!_isScanningMode) {
                  _resetToScanMode();
                } else if (cameraController.value.isRunning == false) {
                  try {
                    cameraController.start();
                  } catch (e) {
                    print("Error starting camera on tap: $e");
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Camera not available.')));
                    }
                  }
                }
              },
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset(
                    'assets/images/qrcode.png',
                    width: 120,
                    height: 120,
                    color: Color(0xFF6A4F1D),
                  ),
                  SizedBox(height: 15),
                  Text(
                    'Tap to check',
                    style: TextStyle(
                      fontFamily: 'Aboreto',
                      fontWeight: FontWeight.w400,
                      fontSize: 20.0,
                      color: Colors.black.withOpacity(0.9),
                    ),
                  ),
                  SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40.0),
                    child: Text(
                      'You can see the product information after scanning the QR code',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w400,
                        fontSize: 12.0,
                        color: Colors.black54,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),
            Container(
              height: screenHeight * 0.30,
              width: screenWidth * 0.75,
              decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade400, width: 1),
                  borderRadius: BorderRadius.circular(12)),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(11.0),
                child: MobileScanner(
                  controller: cameraController,
                  onDetect: _handleBarcodeDetect,
                ),
              ),
            ),
            if (_verificationMessage != null && _productDataFromBackend == null)
              Padding(
                padding: const EdgeInsets.only(top: 20.0, left: 20.0, right: 20.0),
                child: Text(
                  _verificationMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.red.shade700, fontSize: 16, fontWeight: FontWeight.w500),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductDetailsUI(BuildContext context) {
    if (_productDataFromBackend == null) {
      return _buildScannerUI(context);
    }

    final screenHeight = MediaQuery.of(context).size.height;
    final String imageUrl = _productDataFromBackend!['image_url'] ?? '';
    final bool isWarning = _verificationMessage?.toLowerCase().contains('warning') ?? false;

    return Stack(
      children: [
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: screenHeight * 0.55,
          child: imageUrl.isNotEmpty
              ? CachedNetworkImage(
            imageUrl: imageUrl,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
                color: Colors.grey.shade300,
                child: Center(
                    child: CircularProgressIndicator(
                        color: Color(0xFF6A4F1D)))),
            errorWidget: (context, url, error) => Container(
                color: Colors.grey.shade200,
                child: Icon(Icons.broken_image,
                    size: 100, color: Colors.grey.shade400)),
          )
              : Container(
              height: screenHeight * 0.55,
              color: Colors.grey.shade300,
              child: Center(
                  child: Icon(Icons.image_not_supported,
                      size: 100, color: Colors.grey.shade400))),
        ),
        Positioned(
          top: 24.0 + MediaQuery.of(context).padding.top,
          left: 11.0,
          child: Container(
            width: 45.0,
            height: 45.0,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.4),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: Icon(Icons.arrow_back, color: Colors.white, size: 28),
              onPressed: _resetToScanMode,
            ),
          ),
        ),
        Positioned(
          top: 37.0 + MediaQuery.of(context).padding.top,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              padding:
              EdgeInsets.symmetric(vertical: 8.0, horizontal: 30.0),
              decoration: BoxDecoration(
                  color: Color(0xB394AFC9),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.25),
                      blurRadius: 6.0,
                      offset: Offset(0, 2),
                    )
                  ]),
              child: Text(
                'PRODUCT INFORMATION',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontFamily: 'Aboreto',
                    fontWeight: FontWeight.w600,
                    fontSize: 22.0,
                    color: Colors.white),
              ),
            ),
          ),
        ),
        Positioned(
          top: screenHeight * 0.55 - 50,
          left: 0,
          right: 0,
          bottom: 98.0,
          child: Container(
            decoration: BoxDecoration(
              color: Color(0xFF94AFC9),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(42.0),
                topRight: Radius.circular(42.0),
              ),
            ),
            child: Padding(
              padding:
              const EdgeInsets.fromLTRB(25.0, 25.0, 25.0, 10.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        flex: 3,
                        child: Container(
                          decoration: BoxDecoration(boxShadow: [
                            BoxShadow(
                              color: Color(0x30000000),
                              blurRadius: 5.0,
                              offset: Offset(0, 2),
                            ),
                          ]),
                          child: Padding(
                            padding: const EdgeInsets.all(4.0),
                            child: Text(
                              _productDataFromBackend!['product_name'] ??
                                  'Unknown Product',
                              style: TextStyle(
                                fontFamily: 'Aboreto',
                                fontWeight: FontWeight.w400,
                                fontSize: 25.0,
                                color: Color(0xFFFFFFFF),
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: 15),
                      Container(
                        width: 110,
                        height: 48,
                        padding: EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: Color(0xFFE5DFD9),
                          borderRadius: BorderRadius.circular(16.0),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 4.0,
                              offset: Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            isWarning ? 'Warning!' : 'Original',
                            style: TextStyle(
                              fontFamily: 'Poppins',
                              fontWeight: FontWeight.w600,
                              fontSize: 17.0,
                              color: isWarning
                                  ? Colors.red.shade800
                                  : Colors.green.shade800,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 18),
                  Expanded(
                    child: SingleChildScrollView(
                      physics: BouncingScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_verificationMessage != null &&
                              _verificationMessage!.isNotEmpty &&
                              isWarning)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 10.0),
                              child: Text(
                                _verificationMessage!,
                                style: TextStyle(
                                    fontFamily: 'Poppins',
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.red.shade800),
                              ),
                            )
                          else if (_verificationMessage != null &&
                              _verificationMessage!.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 10.0),
                              child: Text(
                                _verificationMessage!,
                                style: TextStyle(
                                    fontFamily: 'Poppins',
                                    fontSize: 14.5,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.black.withOpacity(0.95)),
                              ),
                            ),
                          _buildInfoDetailRow(
                              'Batch No:', _productDataFromBackend!['batch_number']),
                          _buildInfoDetailRow('Manufacture Date:',
                              _productDataFromBackend!['manufacturing_date']),
                          _buildInfoDetailRow(
                              'Expiry Date:', _productDataFromBackend!['expiry_date']),
                          _buildInfoDetailRow(
                              'Ingredients:', _productDataFromBackend!['ingredients']),
                          SizedBox(height: 12),
                          Text(
                            'Scan History for this Product:',
                            style: TextStyle(
                                fontFamily: 'Poppins',
                                fontWeight: FontWeight.w700,
                                fontSize: 15.0,
                                color: Colors.black.withOpacity(0.9)),
                          ),
                          SizedBox(height: 6),
                          if (_productDataFromBackend!['scanHistory'] != null &&
                              (_productDataFromBackend!['scanHistory'] as List).isNotEmpty)
                            Container(
                              constraints: BoxConstraints(maxHeight: 150),
                              child: ListView.builder(
                                shrinkWrap: true,
                                itemCount:
                                (_productDataFromBackend!['scanHistory'] as List).length,
                                itemBuilder: (context, index) {
                                  final scanEntry =
                                  (_productDataFromBackend!['scanHistory'] as List)[index];
                                  return Padding(
                                    padding:
                                    const EdgeInsets.symmetric(vertical: 3.0),
                                    child: Text("- $scanEntry",
                                        style: TextStyle(
                                            fontFamily: 'Poppins',
                                            fontSize: 13.5,
                                            color: Colors.black.withOpacity(0.85))),
                                  );
                                },
                              ),
                            )
                          else
                            Text(
                              "No previous scans recorded for this item.",
                              style: TextStyle(
                                  fontFamily: 'Poppins',
                                  fontSize: 13.5,
                                  fontStyle: FontStyle.italic,
                                  color: Colors.black.withOpacity(0.7)),
                            ),
                          SizedBox(height: 10), // Some padding at the bottom
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        )],
    );
  }

  Widget _buildInfoDetailRow(String label, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: RichText(
        text: TextSpan(
          style: TextStyle( // Default text style for this RichText
            fontFamily: 'Poppins',
            fontSize: 14.0,
            color: Colors.black.withOpacity(0.9), // Changed to black for better visibility on light blue
          ),
          children: [
            TextSpan(text: '$label ', style: TextStyle(fontWeight: FontWeight.w700)),
            TextSpan(text: value ?? 'N/A'),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNavigationBar(BuildContext context) {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: Container(
        height: 88.0,
        decoration: BoxDecoration(
          color: Color(0xFFE5DFD9),
          boxShadow: [
            BoxShadow(
              color: Color(0x40000000),
              blurRadius: 4.0,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            IconButton(
              icon: Image.asset('assets/images/img_1.png', width: 40, height: 40),
              onPressed: _resetToScanMode,
            ),
            IconButton(
              icon: Image.asset('assets/images/img.png', width: 40, height: 40),
              onPressed: () {
                if (mounted) {
                  Navigator.pushNamed(context, '/profile');
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }
}