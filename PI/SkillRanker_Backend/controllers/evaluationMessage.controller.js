const EvaluationMessage = require('../models/EvaluationMessage');

exports.createEvaluationMessage = async (req, res) => {
  try {
    const {
      employeeId,
      employeeEmail,
      employeeName,
      managerId,
      managerName,
      activityTitle,
      note,
      comment,
      title,
      message
    } = req.body;

    if (!employeeId && !employeeEmail) {
      return res.status(400).json({
        success: false,
        message: 'employeeId or employeeEmail is required'
      });
    }

    const finalMessage =
      message ||
      `Votre manager a enregistré une évaluation pour l’activité "${activityTitle || 'activité'}". Note: ${note || 0}/5. ${comment || ''}`;

    const created = await EvaluationMessage.create({
      employeeId: employeeId || '',
      employeeEmail: employeeEmail || '',
      employeeName: employeeName || '',
      managerId: managerId || '',
      managerName: managerName || 'Manager',
      activityTitle: activityTitle || '',
      note: Number(note || 0),
      comment: comment || '',
      title: title || 'Nouvelle évaluation',
      message: finalMessage,
      type: 'EVALUATION',
      read: false
    });

    return res.status(201).json({
      success: true,
      data: created
    });
  } catch (error) {
    console.error('createEvaluationMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getEmployeeEvaluationMessages = async (req, res) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'identifier is required'
      });
    }

    const decodedIdentifier = decodeURIComponent(identifier).toLowerCase();

    const messages = await EvaluationMessage.find({
      $or: [
        { employeeId: decodedIdentifier },
        { employeeEmail: decodedIdentifier }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('getEmployeeEvaluationMessages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.markEvaluationMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await EvaluationMessage.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('markEvaluationMessageAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};