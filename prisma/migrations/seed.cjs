const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    await prisma.grade.deleteMany();
    await prisma.student.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('123456', 10);
    await prisma.user.create({
        data: { name: 'Admin', email: 'admin@demo.com', passwordHash }
    });

    const alunos = [
        { name: 'Ana', age: 20, grades: [8, 7.5, 9] },
        { name: 'Bruno', age: 22, grades: [5, 6, 5.5] },
        { name: 'Carla', age: 19, grades: [4, 3.5, 4.8] }
    ];

    for (const a of alunos) {
        await prisma.student.create({
            data: { name: a.name, age: a.age, grades: { create: a.grades.map(v => ({ value: v })) } }
        });
    }

    console.log('Seed ok. Login: admin@demo.com / 123456');
}

main().finally(() => prisma.$disconnect());
