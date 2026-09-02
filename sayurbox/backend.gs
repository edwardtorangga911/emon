const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

// Ensure the spreadsheet is created and headers are set
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let productSheet = ss.getSheetByName("Products");
  if (!productSheet) {
    productSheet = ss.insertSheet("Products");
    productSheet.appendRow(["id", "kategori", "emoji", "nama", "deskripsi", "harga", "hargaCoret", "satuan", "stok", "label", "rating", "gambar"]);
    // Add dummy data for testing
    productSheet.appendRow(["S001", "Sayuran", "🥬", "Bayam Hijau Organik", "Dipetik pagi ini.", 6000, "", "ikat", 100, "organik", 4.8, "https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=500&auto=format&fit=crop"]);
  }
  
  let orderSheet = ss.getSheetByName("Orders");
  if (!orderSheet) {
    orderSheet = ss.insertSheet("Orders");
    orderSheet.appendRow(["idPesanan", "tanggal", "total", "catatan", "items"]);
  }
}

// ----------------------------------------------------
// DUMMY DATA GENERATOR (Jalankan fungsi ini di Editor Apps Script)
// ----------------------------------------------------
function generateDummyData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let productSheet = ss.getSheetByName("Products");
  
  if (!productSheet) {
    productSheet = ss.insertSheet("Products");
    productSheet.appendRow(["id", "kategori", "emoji", "nama", "deskripsi", "harga", "hargaCoret", "satuan", "stok", "label", "rating", "gambar"]);
  }
  
  const dummies = [
    ["S002", "Sayuran", "🥕", "Wortel Brastagi Premium", "Ukuran jumbo manis, cocok untuk jus dan masakan.", 12000, 15000, "kg", 20, "promo", 4.7, "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=500&auto=format&fit=crop"],
    ["S003", "Sayuran", "🥔", "Kentang Dieng Super", "Kualitas terbaik dari Dieng, tekstur padat.", 18000, "", "kg", 50, "", 4.5, "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=500&auto=format&fit=crop"],
    ["S004", "Sayuran", "🥦", "Brokoli Bebas Pestisida", "Dipanen saat bunga masih kencang, kaya antioksidan.", 22000, "", "pcs", 10, "baru", 4.9, "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=500&auto=format&fit=crop"],
    ["S005", "Sayuran", "🥒", "Timun Jepang Kyuri", "Kulit tipis, renyah tanpa rasa pahit, sempurna untuk salad.", 10000, "", "pcs", 30, "lokal", 4.6, "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?q=80&w=500&auto=format&fit=crop"],
    ["B001", "Buah", "🍌", "Pisang Cavendish", "Tingkat kematangan prima, manis lembut.", 25000, 30000, "sisir", 15, "promo", 4.8, "https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=500&auto=format&fit=crop"],
    ["B002", "Buah", "🍊", "Jeruk Medan Manis", "Kaya vitamin C, rasa manis segar berair banyak tanpa biji.", 28000, "", "kg", 12, "", 4.6, "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?q=80&w=500&auto=format&fit=crop"],
    ["B003", "Buah", "🍎", "Apel Fuji Premium", "Renyah, manis harum, dipetik langsung dari kebun terbaik.", 45000, 55000, "kg", 6, "premium", 4.9, "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?q=80&w=500&auto=format&fit=crop"],
    ["R001", "Bumbu", "🧅", "Bawang Merah Brebes", "Kering bersih beraroma tajam, ukuran besar.", 35000, "", "kg", 20, "", 4.7, "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=500&auto=format&fit=crop"],
    ["R002", "Bumbu", "🧄", "Bawang Putih Kating", "Siung besar padat, rendah air, aroma masakan gurih mantap.", 28000, 35000, "kg", 25, "promo", 4.8, "https://images.unsplash.com/photo-1573506048786-8f08fdba74e8?q=80&w=500&auto=format&fit=crop"],
    ["R003", "Bumbu", "🌶️", "Cabai Merah Keriting", "Pedas pas, warna merah cerah alami, segar bukan cabe kering.", 42000, "", "kg", 7, "terlaris", 4.6, "https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?q=80&w=500&auto=format&fit=crop"],
    ["D001", "Daging", "🥩", "Daging Sapi Slice Segar", "Potongan tipis untuk shabu/yakiniku. Lemak pas.", 115000, 125000, "kg", 5, "premium", 5.0, "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?q=80&w=500&auto=format&fit=crop"],
    ["D002", "Daging", "🍗", "Dada Ayam Fillet", "Bersih tanpa tulang dan kulit. Tinggi protein.", 45000, "", "kg", 15, "terlaris", 4.8, "https://images.unsplash.com/photo-1604503468506-a8da13d82791?q=80&w=500&auto=format&fit=crop"]
  ];
  
  for (let i = 0; i < dummies.length; i++) {
    productSheet.appendRow(dummies[i]);
  }
}

function doGet(e) {
  var action = e.parameter.action;
  
  if (action == 'getProducts') {
    return createJsonResponse(getProducts());
  }
  if (action == 'getOrders') {
    return createJsonResponse(getOrders());
  }
  if (action == 'getHistory') {
    var phone = e.parameter.phone;
    return createJsonResponse(getHistory(phone));
  }
  
  return createJsonResponse({message: "Backend is running. Use actions: getProducts, getOrders"});
}

function doPost(e) {
  if (!e.postData) return createJsonResponse({error: "No POST data"});
  
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    return createJsonResponse({error: "Invalid JSON format"});
  }
  
  var action = data.action;
  
  if (action == 'addProduct') {
    return createJsonResponse(addProduct(data.product));
  }
  if (action == 'updateProduct') {
    return createJsonResponse(updateProduct(data.product));
  }
  if (action == 'deleteProduct') {
    return createJsonResponse(deleteProduct(data.id));
  }
  if (action == 'addOrder') {
    return createJsonResponse(addOrder(data.order));
  }
  if (action == 'uploadImage') {
    return createJsonResponse(uploadImage(data.filename, data.mimeType, data.base64));
  }
  
  return createJsonResponse({error: "Invalid action"});
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ----------------------------------------------------
// PRODUCT CRUD
// ----------------------------------------------------

function getProducts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Products");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const products = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const product = {};
    for (let j = 0; j < headers.length; j++) {
      product[headers[j]] = row[j];
    }
    products.push(product);
  }
  return products;
}

function addProduct(product) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Products");
  if (!sheet) return { success: false, error: "Sheet Products not found" };
  
  sheet.appendRow([
    product.id || generateId('P'), 
    product.kategori || "", 
    product.emoji || "📦", 
    product.nama || "", 
    product.deskripsi || "", 
    product.harga || 0, 
    product.hargaCoret || "", 
    product.satuan || "pcs", 
    product.stok || "", 
    product.label || "", 
    product.rating || 5.0, 
    product.gambar || ""
  ]);
  
  return { success: true, message: "Product added successfully" };
}

function updateProduct(product) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  if (!sheet) return { success: false, error: 'Sheet not found' };
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(product.id)) {
      // Update each column based on headers
      const colMap = {};
      headers.forEach((h, idx) => { colMap[h] = idx + 1; });
      
      if (colMap['kategori']) sheet.getRange(i+1, colMap['kategori']).setValue(product.kategori || '');
      if (colMap['emoji']) sheet.getRange(i+1, colMap['emoji']).setValue(product.emoji || '');
      if (colMap['nama']) sheet.getRange(i+1, colMap['nama']).setValue(product.nama || '');
      if (colMap['deskripsi']) sheet.getRange(i+1, colMap['deskripsi']).setValue(product.deskripsi || '');
      if (colMap['harga']) sheet.getRange(i+1, colMap['harga']).setValue(Number(product.harga) || 0);
      if (colMap['hargaCoret']) sheet.getRange(i+1, colMap['hargaCoret']).setValue(product.hargaCoret || '');
      if (colMap['satuan']) sheet.getRange(i+1, colMap['satuan']).setValue(product.satuan || '');
      if (colMap['stok']) sheet.getRange(i+1, colMap['stok']).setValue(product.stok || '');
      if (colMap['label']) sheet.getRange(i+1, colMap['label']).setValue(product.label || '');
      if (colMap['rating']) sheet.getRange(i+1, colMap['rating']).setValue(Number(product.rating) || 5);
      if (colMap['gambar'] && product.gambar) sheet.getRange(i+1, colMap['gambar']).setValue(product.gambar);
      
      return { success: true, message: 'Product updated' };
    }
  }
  return { success: false, error: 'Product not found' };
}

function deleteProduct(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Products");
  if (!sheet) return { success: false, error: "Sheet Products not found" };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Product deleted" };
    }
  }
  return { success: false, error: "Product not found" };
}

// ----------------------------------------------------
// ORDER CRUD
// ----------------------------------------------------

function getOrders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const orders = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const order = {};
    for (let j = 0; j < headers.length; j++) {
      order[headers[j]] = row[j];
    }
    orders.push(order);
  }
  return orders;
}

function getHistory(phone) {
  if (!phone) return [];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const history = [];
  // The phone number is appended at index 5 (6th column)
  // Let's iterate backwards to get the most recent orders first
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    // Check if column 6 exists and matches the phone
    if (row.length > 5 && String(row[5]) === String(phone)) {
      const order = {};
      for (let j = 0; j < headers.length; j++) {
        order[headers[j]] = row[j];
      }
      // Add the hidden column if header doesn't exist yet in the spreadsheet
      if (headers.length <= 5) order['pelanggan'] = row[5]; 
      history.push(order);
    }
  }
  return history;
}

function addOrder(order) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  if (!sheet) return { success: false, error: "Sheet Orders not found" };
  
  sheet.appendRow([
    order.idPesanan, 
    new Date().toISOString(), 
    order.total, 
    order.catatan, 
    JSON.stringify(order.items),
    order.pelanggan || "" // Kolom 6: No HP / Identitas Pelanggan
  ]);
  
  // Deduct stock if applicable
  try {
    const productSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Products");
    const data = productSheet.getDataRange().getValues();
    
    for (let item of order.items) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] == item.id && data[i][8] !== "") { // index 8 is stok
          let currentStock = parseInt(data[i][8]);
          if (!isNaN(currentStock) && currentStock > 0) {
            productSheet.getRange(i + 1, 9).setValue(currentStock - item.qty);
          }
        }
      }
    }
  } catch (err) {
    // Ignore stock deduction errors
  }
  
  return { success: true, idPesanan: order.idPesanan };
}

// Helper to generate IDs
function generateId(prefix) {
  return prefix + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

// ----------------------------------------------------
// IMAGE UPLOAD (DRIVE)
// ----------------------------------------------------
function uploadImage(filename, mimeType, base64Data) {
  try {
    // Decode base64
    var decoded = Utilities.base64Decode(base64Data.split(',')[1] || base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);
    
    // Check if folder exists
    var folderIterator = DriveApp.getFoldersByName("SayurBox_Images");
    var folder;
    if (folderIterator.hasNext()) {
      folder = folderIterator.next();
    } else {
      folder = DriveApp.createFolder("SayurBox_Images");
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    var file = folder.createFile(blob);
    // Google Drive direct image link
    var url = "https://drive.google.com/uc?id=" + file.getId(); 
    
    return { success: true, url: url };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
