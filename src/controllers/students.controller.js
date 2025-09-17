import { prisma } from '../db/prisma.js';

const isValidGrade = (n) => typeof n === 'number' && n >= 0 && n <= 10;
const average = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const sum = arr.reduce((acc, n) => acc + n, 0);
    return Number((sum / arr.length).toFixed(2));
};

export async function list(req, res) {
    const { page = 1, size = 50 } = req.query;
    const take = Math.min(Number(size) || 50, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const [rows, total] = await Promise.all([
        prisma.student.findMany({ include: { grades: true }, orderBy: { id: 'asc' }, skip, take }),
        prisma.student.count()
    ]);

    const items = rows.map((s) => ({
        id: String(s.id),
        name: s.name,
        age: s.age,
        grades: s.grades.map(g => g.value),
        average: average(s.grades.map(g => g.value))
    }));

    return res.json({ items, page: Number(page), size: take, total });
}

export async function search(req, res) {
    const q = String(req.query.q || '');
    const rows = await prisma.student.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        include: { grades: true },
        orderBy: { id: 'asc' }
    });

    const items = rows.map((s) => ({
        id: String(s.id),
        name: s.name,
        age: s.age,
        grades: s.grades.map(g => g.value),
        average: average(s.grades.map(g => g.value))
    }));

    return res.json(items);
}

export async function create(req, res) {
    const { name, age, grades } = req.body || {};

    if (!name || age == null || !Array.isArray(grades) || grades.length === 0) {
        return res.status(400).json({ error: 'name, age e grades (array) são obrigatórios' });
    }
    if (typeof age !== 'number' || age <= 0) {
        return res.status(400).json({ error: 'age deve ser número positivo' });
    }
    if (!grades.every(isValidGrade)) {
        return res.status(400).json({ error: 'grades devem ser números entre 0 e 10' });
    }

    const created = await prisma.student.create({
        data: {
            name,
            age,
            grades: { create: grades.map(v => ({ value: v })) }
        },
        include: { grades: true }
    });

    return res.status(201).json({
        id: String(created.id),
        name: created.name,
        age: created.age,
        grades: created.grades.map(g => g.value)
    });
}

export async function update(req, res) {
    const id = Number(req.params.id);
    const { name, age, grades } = req.body || {};

    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    if (age != null && (typeof age !== 'number' || age <= 0)) {
        return res.status(400).json({ error: 'age deve ser número positivo' });
    }
    if (grades != null) {
        if (!Array.isArray(grades) || !grades.every(isValidGrade)) {
            return res.status(400).json({ error: 'grades deve ser array de números entre 0 e 10' });
        }
    }

    const exists = await prisma.student.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Aluno não encontrado' });

    const updated = await prisma.student.update({
        where: { id },
        data: {
            ...(name !== undefined ? { name } : {}),
            ...(age !== undefined ? { age } : {}),
            ...(grades !== undefined ? {
                grades: { deleteMany: {}, create: grades.map(v => ({ value: v })) }
            } : {})
        },
        include: { grades: true }
    });

    return res.json({
        id: String(updated.id),
        name: updated.name,
        age: updated.age,
        grades: updated.grades.map(g => g.value)
    });
}

export async function remove(req, res) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

    const exists = await prisma.student.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Aluno não encontrado' });

    await prisma.student.delete({ where: { id } });
    return res.json({ removed: true });
}

export async function classAverage(_req, res) {
    const rows = await prisma.student.findMany({ include: { grades: true } });
    const averages = rows.map(s => average(s.grades.map(g => g.value)));
    const mean = averages.length
        ? Number((averages.reduce((acc, n) => acc + n, 0) / averages.length).toFixed(2))
        : 0;
    return res.json({ classAverage: mean });
}

export async function topStudent(_req, res) {
    const rows = await prisma.student.findMany({ include: { grades: true } });
    if (!rows.length) return res.json(null);

    const items = rows.map(s => ({
        id: String(s.id),
        name: s.name,
        age: s.age,
        grades: s.grades.map(g => g.value),
        average: average(s.grades.map(g => g.value))
    }));

    const top = items.reduce((best, s) => (s.average > best.average ? s : best), items[0]);
    return res.json(top);
}

export async function reports(req, res) {
    const rows = await prisma.student.findMany({ include: { grades: true } });
    const items = rows.map(s => ({
        id: String(s.id),
        name: s.name,
        age: s.age,
        grades: s.grades.map(g => g.value),
        average: average(s.grades.map(g => g.value))
    }));

    const buckets = {
        aprovados: items.filter(s => s.average >= 7),
        recuperacao: items.filter(s => s.average >= 5 && s.average < 7),
        reprovados: items.filter(s => s.average < 5)
    };

    const { status } = req.query || {};
    return res.json(status ? (buckets[status] || []) : buckets);
}
