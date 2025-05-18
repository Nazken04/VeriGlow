import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';

class ProfilePage extends StatefulWidget {
  @override
  _ProfilePageState createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String _userName = 'User'; // Default
  List<dynamic> _scanHistory = [];
  bool _isLoading = true;
  String? _errorMessage;
  final storage = FlutterSecureStorage();

  final String _baseNgrokUrl = 'https://2771-5-34-33-30.ngrok-free.app';

  final List<Map<String, String>> _faqData = [
    {
      'question': '1) What is the purpose of the application?',
      'answer':
      'VeriGlow is a blockchain-powered application designed to verify the authenticity of cosmetic products. It’s simple to use: scan the QR code on the product, and the system will instantly check our secure blockchain database to determine whether the product is genuine. Each item with a VeriGlow QR code has a unique digital identity — there are no duplicates.',
    },
    {
      'question': '2) How should I scan QR codes properly?',
      'answer':
      "When you're at a store or point of purchase, we recommend scanning more than one item of the same product. This helps detect potential counterfeit attempts. Some counterfeiters replicate a single QR code and attach it to multiple fake products. If you notice that different products return the same QR code in your scan history, it’s likely not authentic — even if the system hasn’t flagged it yet.",
    },
    {
      'question': '3) How does the system detect counterfeit products?',
      'answer':
      'VeriGlow uses smart detection logic powered by blockchain analytics. If a single QR code is scanned more than 10 times in completely different locations within a 3-day period, the product is flagged as potentially counterfeit. This helps us quickly identify and isolate fake products in circulation.',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadAllUserData();
  }

  Future<String?> _getAuthToken() async {
    return await storage.read(key: 'jwt_token');
  }

  Future<void> _loadAllUserData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final token = await _getAuthToken();
    if (!mounted) return;

    if (token == null) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Authentication required. Please log in.';
      });

      return;
    }

    try {
      final profileResponse = await http.get(
        Uri.parse('$_baseNgrokUrl/api/auth/profile'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      ).timeout(Duration(seconds: 15));

      if (!mounted) return;
      if (profileResponse.statusCode == 200) {
        final profileData = json.decode(profileResponse.body);
        setState(() {
          _userName = profileData['name'] ?? 'User';
        });
      } else {
        print('Failed to fetch profile: ${profileResponse.statusCode} ${profileResponse.body}');
      }

      final scanHistoryResponse = await http.get(
        Uri.parse('$_baseNgrokUrl/api/auth/scan-history'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      ).timeout(Duration(seconds: 15));

      if (!mounted) return;
      if (scanHistoryResponse.statusCode == 200) {
        final scanHistoryData = json.decode(scanHistoryResponse.body);
        setState(() {
          if (scanHistoryData['scanHistory'] is List) {
            _scanHistory = scanHistoryData['scanHistory'];
          } else {
            _scanHistory = [];
            print("Scan history data is not in expected List format: ${scanHistoryData['scanHistory']}");
          }
        });
      } else {
        print('Failed to load scan history: ${scanHistoryResponse.statusCode} ${scanHistoryResponse.body}');
        setState(() {
          _errorMessage = 'Failed to load user data. Please try again. (SH_ERR: ${scanHistoryResponse.statusCode})';
        });
      }
    } catch (e) {
      if (!mounted) return;
      print('Error loading user data: $e');
      setState(() {
        _errorMessage = 'An error occurred: $e. Please check your connection and try again.';
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  String _formatScanTime(String? timeString) {
    if (timeString == null) return 'N/A';
    try {
      final dateTime = DateTime.parse(timeString);
      return DateFormat('MMM dd, yyyy - hh:mm a').format(dateTime.toLocal());
    } catch (e) {
      return timeString;
    }
  }

  Widget _buildFaqSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'F.A.Q.',
            style: TextStyle(
              fontFamily: 'Poppins',
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: Colors.black.withOpacity(0.85),
            ),
          ),
          SizedBox(height: 15.0),
          ListView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: _faqData.length,
            itemBuilder: (context, index) {
              final item = _faqData[index];
              return Card(
                elevation: 1.5,
                margin: EdgeInsets.symmetric(vertical: 6.0),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.0),
                ),
                color: Colors.white.withOpacity(0.88),
                child: ExpansionTile(
                  iconColor: Color(0xFF6A4F1D),
                  collapsedIconColor: Colors.black54,
                  tilePadding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  title: Text(
                    item['question']!,
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w500,
                      fontSize: 16.0,
                      color: Colors.black87,
                    ),
                  ),
                  children: <Widget>[
                    Padding(
                      padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 16.0, top: 8.0),
                      child: Text(
                        item['answer']!,
                        textAlign: TextAlign.justify,
                        style: TextStyle(
                          fontFamily: 'Poppins',
                          fontSize: 14.0,
                          color: Colors.black.withOpacity(0.75),
                          height: 1.4,
                        ),
                      ),
                    )
                  ],
                ),
              );
            },
          ),
        ],
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
              color: Colors.black.withOpacity(0.15),
              blurRadius: 6.0,
              offset: Offset(0, -3),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            IconButton(
              icon: Image.asset('assets/images/img_1.png', width: 40, height: 40),
              onPressed: () {
                if (mounted) {
                  Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
                }
              },
            ),
            IconButton(
              icon: Image.asset('assets/images/img.png', width: 40, height: 40),
              onPressed: _isLoading ? null : _loadAllUserData,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFE5DFD9),
      body: SafeArea(
        child: Stack(
          children: [
            RefreshIndicator(
              onRefresh: _loadAllUserData,
              color: Color(0xFF6A4F1D),
              child: SingleChildScrollView(
                physics: AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 88.0 + 10.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: 30.0, left: 20.0, right: 20.0, bottom: 15.0),
                        child: Row(
                          children: [
                            Spacer(),
                            Flexible(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Hi, $_userName!',
                                    style: TextStyle(
                                      fontFamily: 'Aboreto',
                                      fontWeight: FontWeight.w400,
                                      fontSize: 24.0,
                                      color: Colors.black87,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                    textAlign: TextAlign.right,
                                  ),
                                  SizedBox(height: 4.0),
                                  Text(
                                    'Welcome',
                                    style: TextStyle(
                                      fontFamily: 'Aboreto',
                                      fontWeight: FontWeight.w400,
                                      fontSize: 16.0,
                                      color: Colors.black54,
                                    ),
                                    textAlign: TextAlign.right,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),


                      _isLoading
                          ? Padding(
                        padding: const EdgeInsets.symmetric(vertical: 50.0),
                        child: Center(child: CircularProgressIndicator(color: Color(0xFF6A4F1D))),
                      )
                          : _errorMessage != null
                          ? Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.error_outline, color: Colors.red.shade700, size: 50),
                              SizedBox(height: 10),
                              Text(_errorMessage!,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.red.shade700, fontSize: 16)),
                              SizedBox(height: 20),
                              ElevatedButton(
                                onPressed: _loadAllUserData,
                                style: ElevatedButton.styleFrom(backgroundColor: Color(0xFF6A4F1D)),
                                child: Text('Try Again', style: TextStyle(color: Colors.white)),
                              )
                            ],
                          ),
                        ),
                      )
                          : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 10.0, top: 10.0),
                                  child: Text(
                                    'Your Scan History',
                                    style: TextStyle(
                                        fontFamily: 'Poppins',
                                        fontSize: 20,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black.withOpacity(0.8)),
                                  ),
                                ),
                                _scanHistory.isEmpty
                                    ? Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 30.0),
                                  child: Center(
                                    child: Text(
                                      'No scans available.\nStart scanning QR codes to view your history.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontFamily: 'Poppins',
                                        fontSize: 16.0,
                                        color: Colors.black54,
                                      ),
                                    ),
                                  ),
                                )
                                    : ListView.builder(
                                  shrinkWrap: true,
                                  physics: NeverScrollableScrollPhysics(),
                                  itemCount: _scanHistory.length,
                                  itemBuilder: (context, index) {
                                    final scan = _scanHistory[index];
                                    final productData = scan['product'];
                                    final String productName = productData != null && productData is Map
                                        ? productData['product_name']?.toString() ?? 'Unknown Product'
                                        : 'Product Data Error';
                                    final String? imageUrl = productData != null && productData is Map
                                        ? productData['image_url']?.toString()
                                        : null;
                                    final String? scanTime = scan['scannedAt']?.toString();
                                    final String? scanLocation = scan['location']?.toString();

                                    return Card(
                                      elevation: 2.0,
                                      margin: EdgeInsets.symmetric(vertical: 8.0),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12.0),
                                      ),
                                      color: Colors.white.withOpacity(0.9),
                                      child: ListTile(
                                        contentPadding: EdgeInsets.all(12.0),
                                        leading: (imageUrl != null && imageUrl.isNotEmpty)
                                            ? ClipRRect(
                                          borderRadius: BorderRadius.circular(8.0),
                                          child: Image.network(
                                            imageUrl,
                                            width: 60,
                                            height: 60,
                                            fit: BoxFit.cover,
                                            errorBuilder: (context, error, stackTrace) =>
                                                Container(width: 60, height: 60, color: Colors.grey.shade300, child: Icon(Icons.broken_image, color: Colors.grey.shade600, size: 30)),
                                          ),
                                        )
                                            : Container(
                                          width: 60,
                                          height: 60,
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade300,
                                            borderRadius: BorderRadius.circular(8.0),
                                          ),
                                          child: Icon(Icons.image_not_supported, color: Colors.grey.shade600, size: 30),
                                        ),
                                        title: Text(
                                          productName,
                                          style: TextStyle(
                                            fontFamily: 'Poppins',
                                            fontWeight: FontWeight.w600,
                                            fontSize: 16.0,
                                          ),
                                        ),
                                        subtitle: Text(
                                          'Scanned: ${_formatScanTime(scanTime)}\nLocation: ${scanLocation ?? 'N/A'}',
                                          style: TextStyle(
                                            fontFamily: 'Poppins',
                                            fontSize: 13.0,
                                            color: Colors.black54,
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 20), // Space before FAQ
                          _buildFaqSection(),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Bottom Navigation Panel
            _buildBottomNavigationBar(context),
          ],
        ),
      ),
    );
  }
}