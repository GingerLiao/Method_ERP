import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 產生過去 N 天內的隨機日期
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("🌱 清除舊資料...");
  // 依外鍵順序刪除
  await prisma.stockMovement.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.bomItem.deleteMany();
  await prisma.bom.deleteMany();
  await prisma.productionOrder.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();

  console.log("🏭 建立倉庫...");
  const whMain = await prisma.warehouse.create({
    data: { code: "WH01", name: "主倉庫", location: "新竹科學園區" },
  });
  const whProd = await prisma.warehouse.create({
    data: { code: "WH02", name: "生產倉", location: "新竹廠 B 棟" },
  });

  console.log("🗂️ 建立分類...");
  const catRaw = await prisma.category.create({ data: { name: "原物料" } });
  const catPart = await prisma.category.create({ data: { name: "零組件" } });
  const catFinished = await prisma.category.create({ data: { name: "成品" } });

  console.log("📦 建立商品...");
  // 原料 / 零件
  const screw = await prisma.product.create({
    data: {
      sku: "RM-0001", name: "M3 六角螺絲", categoryId: catPart.id, unit: "顆",
      type: "STOCK", costPrice: 0.8, salePrice: 2, safetyStock: 2000,
      reorderPoint: 3000, reorderQty: 10000, barcode: "4710000000017",
    },
  });
  const pcb = await prisma.product.create({
    data: {
      sku: "RM-0002", name: "主控電路板 PCB-A", categoryId: catPart.id, unit: "片",
      type: "STOCK", costPrice: 120, salePrice: 260, safetyStock: 150,
      reorderPoint: 200, reorderQty: 500,
    },
  });
  const battery = await prisma.product.create({
    data: {
      sku: "RM-0003", name: "18650 鋰電池", categoryId: catRaw.id, unit: "顆",
      type: "STOCK", costPrice: 45, salePrice: 90, safetyStock: 300,
      reorderPoint: 400, reorderQty: 1000,
    },
  });
  const casing = await prisma.product.create({
    data: {
      sku: "RM-0004", name: "鋁合金外殼", categoryId: catRaw.id, unit: "件",
      type: "STOCK", costPrice: 85, salePrice: 180, safetyStock: 100,
      reorderPoint: 150, reorderQty: 400,
    },
  });
  const sensor = await prisma.product.create({
    data: {
      sku: "RM-0005", name: "溫濕度感測模組", categoryId: catPart.id, unit: "個",
      type: "STOCK", costPrice: 60, salePrice: 130, safetyStock: 200,
      reorderPoint: 250, reorderQty: 600,
    },
  });

  // 成品（組合品，含 BOM）
  const iotDevice = await prisma.product.create({
    data: {
      sku: "FG-1001", name: "智慧環境監測器 M1", categoryId: catFinished.id, unit: "台",
      type: "BOM", costPrice: 0, salePrice: 1990, safetyStock: 30,
      reorderPoint: 40, reorderQty: 100,
      description: "整合溫濕度感測、無線傳輸的環境監測裝置",
    },
  });
  const powerBank = await prisma.product.create({
    data: {
      sku: "FG-1002", name: "工業級行動電源 P2", categoryId: catFinished.id, unit: "台",
      type: "BOM", costPrice: 0, salePrice: 1290, safetyStock: 20,
      reorderPoint: 30, reorderQty: 80,
    },
  });

  const allProducts = [screw, pcb, battery, casing, sensor, iotDevice, powerBank];

  console.log("🧩 建立 BOM 物料清單...");
  // 智慧環境監測器 M1 = 1 PCB + 1 感測模組 + 1 外殼 + 4 螺絲
  const bomIot = await prisma.bom.create({
    data: {
      productId: iotDevice.id, version: "v1", note: "M1 標準組裝清單",
      items: {
        create: [
          { componentId: pcb.id, quantity: 1 },
          { componentId: sensor.id, quantity: 1 },
          { componentId: casing.id, quantity: 1 },
          { componentId: screw.id, quantity: 4, lossRate: 5 },
        ],
      },
    },
  });
  // 工業級行動電源 P2 = 3 電池 + 1 PCB + 1 外殼 + 6 螺絲
  await prisma.bom.create({
    data: {
      productId: powerBank.id, version: "v1", note: "P2 標準組裝清單",
      items: {
        create: [
          { componentId: battery.id, quantity: 3 },
          { componentId: pcb.id, quantity: 1 },
          { componentId: casing.id, quantity: 1 },
          { componentId: screw.id, quantity: 6, lossRate: 5 },
        ],
      },
    },
  });

  console.log("🤝 建立供應商...");
  const sup1 = await prisma.supplier.create({
    data: { code: "SUP001", name: "鴻運電子零件", contact: "王經理", phone: "03-1234567", taxId: "12345678", email: "sales@hongyun.com.tw" },
  });
  const sup2 = await prisma.supplier.create({
    data: { code: "SUP002", name: "台鋁精密", contact: "陳小姐", phone: "04-7654321", taxId: "87654321" },
  });

  console.log("👤 建立客戶...");
  const cus1 = await prisma.customer.create({
    data: { code: "CUS001", name: "智聯科技", contact: "林總", phone: "02-27001234", taxId: "22334455", email: "buy@zhilian.com" },
  });
  const cus2 = await prisma.customer.create({
    data: { code: "CUS002", name: "綠能系統整合", contact: "張工程師", phone: "07-3339999", taxId: "55667788" },
  });

  console.log("📥 建立期初庫存（庫存異動）...");
  const openingStock: Array<[typeof screw, number]> = [
    [screw, 2500], [pcb, 180], [battery, 350], [casing, 90], [sensor, 210],
    [iotDevice, 200], [powerBank, 120],
  ];
  for (const [p, qty] of openingStock) {
    await prisma.stockMovement.create({
      data: {
        productId: p.id, warehouseId: whMain.id, type: "IN", quantity: qty,
        unitCost: p.costPrice, refType: "MANUAL", note: "期初庫存",
        createdAt: daysAgo(60),
      },
    });
    await prisma.inventory.create({
      data: { productId: p.id, warehouseId: whMain.id, quantity: qty },
    });
  }

  console.log("🛒 建立歷史採購單...");
  let poSeq = 1;
  for (let i = 0; i < 6; i++) {
    const d = daysAgo(50 - i * 7);
    const items = [
      { product: pcb, qty: 300 },
      { product: battery, qty: 500 },
      { product: casing, qty: 200 },
    ];
    let total = 0;
    const itemData = items.map((it) => {
      const subtotal = it.qty * it.product.costPrice;
      total += subtotal;
      return {
        productId: it.product.id, quantity: it.qty, unitPrice: it.product.costPrice,
        receivedQty: it.qty, subtotal,
      };
    });
    await prisma.purchaseOrder.create({
      data: {
        orderNo: `PO${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(poSeq++).padStart(4, "0")}`,
        supplierId: i % 2 === 0 ? sup1.id : sup2.id, warehouseId: whMain.id,
        status: "RECEIVED", orderDate: d, total, createdAt: d,
        items: { create: itemData },
      },
    });
    // 對應入庫異動
    for (const it of items) {
      await prisma.stockMovement.create({
        data: {
          productId: it.product.id, warehouseId: whMain.id, type: "IN",
          quantity: it.qty, unitCost: it.product.costPrice, refType: "PURCHASE",
          note: "採購入庫", createdAt: d,
        },
      });
      const inv = await prisma.inventory.findUnique({
        where: { productId_warehouseId: { productId: it.product.id, warehouseId: whMain.id } },
      });
      if (inv) await prisma.inventory.update({ where: { id: inv.id }, data: { quantity: inv.quantity + it.qty } });
    }
  }

  console.log("🧾 建立歷史銷售單...");
  let soSeq = 1;
  for (let i = 0; i < 10; i++) {
    const d = daysAgo(45 - i * 4);
    const items = [
      { product: iotDevice, qty: 5 + (i % 4) * 3 },
      { product: powerBank, qty: 3 + (i % 3) * 2 },
    ];
    let total = 0;
    const itemData = items.map((it) => {
      const subtotal = it.qty * it.product.salePrice;
      total += subtotal;
      return {
        productId: it.product.id, quantity: it.qty, unitPrice: it.product.salePrice,
        shippedQty: it.qty, subtotal,
      };
    });
    await prisma.salesOrder.create({
      data: {
        orderNo: `SO${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(soSeq++).padStart(4, "0")}`,
        customerId: i % 2 === 0 ? cus1.id : cus2.id, warehouseId: whMain.id,
        status: "SHIPPED", orderDate: d, total, createdAt: d,
        items: { create: itemData },
      },
    });
    // 對應出庫異動
    for (const it of items) {
      await prisma.stockMovement.create({
        data: {
          productId: it.product.id, warehouseId: whMain.id, type: "OUT",
          quantity: -it.qty, refType: "SALE", note: "銷售出貨", createdAt: d,
        },
      });
      const inv = await prisma.inventory.findUnique({
        where: { productId_warehouseId: { productId: it.product.id, warehouseId: whMain.id } },
      });
      if (inv) await prisma.inventory.update({ where: { id: inv.id }, data: { quantity: inv.quantity - it.qty } });
    }
  }

  console.log("⚙️ 建立一張生產工單...");
  await prisma.productionOrder.create({
    data: {
      orderNo: `MO${new Date().getFullYear()}0801-0001`,
      productId: iotDevice.id, bomId: bomIot.id, warehouseId: whProd.id,
      quantity: 50, status: "DRAFT", note: "補充成品庫存",
    },
  });

  console.log("✅ 種子資料建立完成！");
  console.log(`   商品 ${allProducts.length} 筆、倉庫 2、供應商 2、客戶 2`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
