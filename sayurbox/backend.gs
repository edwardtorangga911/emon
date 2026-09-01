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
