import Student from '../models/Student.js';

export const awardPoints = async (req, res) => {
    const { studentId, points } = req.body;
    const teacherId = req.user.id;

    try {
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        student.points += points;
        await student.save();

        res.status(200).json({ message: 'Points awarded successfully', student });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
