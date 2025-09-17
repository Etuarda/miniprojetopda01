// Controller de estudantes (dados 100% em memória)

// "Banco" em memória para estudantes
const students = []; // { id, name, age, grades:number[] }
let nextStudentId = 1;

/**
 * Helpers de validação e cálculo
 */
const isValidGrade = (n) => typeof n === 'number' && n >= 0 && n <= 10;

const average = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const sum = arr.reduce((acc, n) => acc + n, 0);
    return Number((sum / arr.length).toFixed(2));
};

/**
 * GET /api/students
 * Lista alunos com média individual
 */
export async function list(_req, res) {
    const items = students.map((s) => ({ ...s, average: average(s.grades) })); // map
    return res.json(items);
}

/**
 * GET /api/students/search?q=ana
 * Busca parcial e case-insensitive por nome
 */
export async function search(req, res) {
    const query = String(req.query.q || '').toLowerCase();

    const items = students
        .map((s) => ({ ...s, average: average(s.grades) })) // map
        .filter((s) => s.name.toLowerCase().includes(query)); // filter

    return res.json(items);
}

/**
 * POST /api/students
 * body: { name, age, grades:[0..10] }
 */
export async function create(req, res) {
    const { name, age, grades } = req.body || {};

    // Validações básicas (rubrica)
    if (!name || age == null || !Array.isArray(grades) || grades.length === 0) {
        return res.status(400).json({ error: 'name, age e grades (array) são obrigatórios' });
    }
    if (typeof age !== 'number' || age <= 0) {
        return res.status(400).json({ error: 'age deve ser número positivo' });
    }
    if (!grades.every(isValidGrade)) {
        return res.status(400).json({ error: 'grades devem ser números entre 0 e 10' });
    }

    // Cria o estudante
    const created = {
        id: String(nextStudentId++), // ID incremental didático
        name,
        age,
        grades
    };
    students.push(created);

    return res.status(201).json(created);
}

/**
 * PUT /api/students/:id
 * body parcial: { name?, age?, grades? }
 */
export async function update(req, res) {
    const { id } = req.params;
    const { name, age, grades } = req.body || {};

    // Validações parciais
    if (age != null && (typeof age !== 'number' || age <= 0)) {
        return res.status(400).json({ error: 'age deve ser número positivo' });
    }
    if (grades != null) {
        if (!Array.isArray(grades) || !grades.every(isValidGrade)) {
            return res.status(400).json({ error: 'grades deve ser array de números entre 0 e 10' });
        }
    }

    const index = students.findIndex((s) => s.id === id);
    if (index < 0) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    // Merge seguro de campos opcionais
    const current = students[index];
    const next = {
        ...current,
        ...(name !== undefined ? { name } : {}),
        ...(age !== undefined ? { age } : {}),
        ...(grades !== undefined ? { grades } : {})
    };

    students[index] = next;
    return res.json(next);
}

/**
 * DELETE /api/students/:id
 */
export async function remove(req, res) {
    const index = students.findIndex((s) => s.id === req.params.id);
    if (index < 0) {
        return res.status(404).json({ error: 'Aluno não encontrado' });
    }
    students.splice(index, 1);
    return res.json({ removed: true });
}

/**
 * GET /api/students/stats/average
 * Média geral da turma
 */
export async function classAverage(_req, res) {
    const averages = students.map((s) => average(s.grades)); // map
    const mean = averages.length
        ? Number((averages.reduce((acc, n) => acc + n, 0) / averages.length).toFixed(2)) // reduce
        : 0;

    return res.json({ classAverage: mean });
}

/**
 * GET /api/students/stats/top
 * Estudante com maior média
 */
export async function topStudent(_req, res) {
    const items = students.map((s) => ({ ...s, average: average(s.grades) }));
    if (!items.length) return res.json(null);

    // reduce para achar o maior
    const top = items.reduce((best, s) => (s.average > best.average ? s : best), items[0]);
    return res.json(top);
}

/**
 * GET /api/students/reports?status=aprovados|recuperacao|reprovados
 * Relatórios por bucket de desempenho
 */
export async function reports(req, res) {
    const items = students.map((s) => ({ ...s, average: average(s.grades) }));

    const buckets = {
        aprovados: items.filter((s) => s.average >= 7),
        recuperacao: items.filter((s) => s.average >= 5 && s.average < 7),
        reprovados: items.filter((s) => s.average < 5)
    };

    const { status } = req.query;
    return res.json(status ? (buckets[status] || []) : buckets);
}
