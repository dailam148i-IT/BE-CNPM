import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // 1. Roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER', description: 'Khách hàng' }
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Quản trị viên' }
    }),
    prisma.role.upsert({
      where: { name: 'STAFF' },
      update: {},
      create: { name: 'STAFF', description: 'Nhân viên' }
    })
  ]);
  console.log('✅ Roles created');

  // 2. Admin User
  console.log('Creating admin user...');
  const adminRole = roles.find(r => r.name === 'ADMIN');
  if (!adminRole) throw new Error('Admin role not found');
  
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@teashop.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@teashop.com',
      passwordHash: hashedPassword,
      fullName: 'Admin System',
      phone: '0900000000',
      roleId: adminRole.id,
      status: 'ACTIVE'
    }
  });
  console.log('✅ Admin user created (admin@teashop.com / 123456)');

  // 3. Categories
  console.log('Creating categories...');
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'tra-o-long' },
      update: {},
      create: { name: 'Trà Ô Long', slug: 'tra-o-long', description: 'Trà Ô Long cao cấp nhập khẩu', type: 'PRODUCT' }
    }),
    prisma.category.upsert({
      where: { slug: 'hong-tra' },
      update: {},
      create: { name: 'Hồng Trà', slug: 'hong-tra', description: 'Hồng trà đậm đà hương vị', type: 'PRODUCT' }
    }),
    prisma.category.upsert({
      where: { slug: 'tra-xanh' },
      update: {},
      create: { name: 'Trà Xanh', slug: 'tra-xanh', description: 'Trà xanh tinh khiết từ thiên nhiên', type: 'PRODUCT' }
    }),
    prisma.category.upsert({
      where: { slug: 'tra-thao-moc' },
      update: {},
      create: { name: 'Trà Thảo Mộc', slug: 'tra-thao-moc', description: 'Trà từ các loại thảo mộc tự nhiên', type: 'PRODUCT' }
    }),
    prisma.category.upsert({
      where: { slug: 'tin-tuc' },
      update: {},
      create: { name: 'Tin tức', slug: 'tin-tuc', description: 'Tin tức về trà và sức khỏe', type: 'NEWS' }
    })
  ]);
  console.log('✅ Categories created');

  // 4. Sample Products
  console.log('Creating sample products...');
  const oLongCategory = categories.find(c => c.slug === 'tra-o-long');
  const hongTraCategory = categories.find(c => c.slug === 'hong-tra');
  const traXanhCategory = categories.find(c => c.slug === 'tra-xanh');
  
  interface ProductData {
    name: string;
    slug: string;
    description: string;
    shortDesc: string;
    price: number;
    stockQuantity: number;
    sku: string;
    status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN' | 'DISCONTINUED';
    categoryId: string;
  }

  const products: ProductData[] = [
    {
      name: 'Trà Ô Long Đài Loan',
      slug: 'tra-o-long-dai-loan',
      description: 'Trà Ô Long nhập khẩu từ Đài Loan, hương thơm đặc trưng, vị ngọt dịu.',
      shortDesc: 'Trà Ô Long cao cấp từ Đài Loan',
      price: 250000,
      stockQuantity: 100,
      sku: 'TOL-001',
      status: 'PUBLISHED',
      categoryId: oLongCategory!.id
    },
    {
      name: 'Trà Ô Long Thiết Quan Âm',
      slug: 'tra-o-long-thiet-quan-am',
      description: 'Thiết Quan Âm - một trong những loại Ô Long nổi tiếng nhất thế giới.',
      shortDesc: 'Thiết Quan Âm hảo hạng',
      price: 350000,
      stockQuantity: 50,
      sku: 'TOL-002',
      status: 'PUBLISHED',
      categoryId: oLongCategory!.id
    },
    {
      name: 'Hồng Trà Chính Sơn',
      slug: 'hong-tra-chinh-son',
      description: 'Hồng trà Chính Sơn từ vùng Vũ Di Sơn, Phúc Kiến.',
      shortDesc: 'Hồng trà cao cấp',
      price: 280000,
      stockQuantity: 80,
      sku: 'HT-001',
      status: 'PUBLISHED',
      categoryId: hongTraCategory!.id
    },
    {
      name: 'Trà Xanh Thái Nguyên',
      slug: 'tra-xanh-thai-nguyen',
      description: 'Trà xanh đặc sản Thái Nguyên, hương thơm tự nhiên.',
      shortDesc: 'Trà xanh Việt Nam',
      price: 180000,
      stockQuantity: 150,
      sku: 'TX-001',
      status: 'PUBLISHED',
      categoryId: traXanhCategory!.id
    },
    {
      name: 'Trà Xanh Matcha Nhật Bản',
      slug: 'tra-xanh-matcha-nhat-ban',
      description: 'Bột trà xanh Matcha nguyên chất từ Nhật Bản.',
      shortDesc: 'Matcha Uji cao cấp',
      price: 450000,
      stockQuantity: 30,
      sku: 'TX-002',
      status: 'PUBLISHED',
      categoryId: traXanhCategory!.id
    }
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product
    });
  }
  console.log('✅ Sample products created');

  // 5. Sample Customer
  console.log('Creating sample customer...');
  const customerRole = roles.find(r => r.name === 'CUSTOMER');
  if (!customerRole) throw new Error('Customer role not found');
  
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      username: 'customer',
      email: 'customer@example.com',
      passwordHash: hashedPassword,
      fullName: 'Khách Hàng Demo',
      phone: '0901234567',
      roleId: customerRole.id,
      status: 'ACTIVE'
    }
  });
  console.log('✅ Sample customer created (customer@example.com / 123456)');

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📋 Test accounts:');
  console.log('   Admin: admin@teashop.com / 123456');
  console.log('   Customer: customer@example.com / 123456');
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
