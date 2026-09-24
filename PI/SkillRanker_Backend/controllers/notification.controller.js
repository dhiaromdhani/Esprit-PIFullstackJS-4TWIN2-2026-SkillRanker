// const bcrypt = require("bcryptjs");
// const Activity = require("../models/Activity");
// const Employee = require("../models/Employee");
// const User = require("../models/User");
// const {
//   sendActivityEmail,
//   sendResponseEmail,
// } = require("../services/emailNotification.service");

// const AUTO_EMPLOYEE_TEMP_PASSWORD =
//   process.env.AUTO_EMPLOYEE_TEMP_PASSWORD || "123456";

// function normalizeEmail(value = "") {
//   return String(value || "").trim().toLowerCase();
// }

// function normalizeHumanText(value = "") {
//   return String(value || "")
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .toLowerCase()
//     .trim();
// }

// function escapeRegex(value = "") {
//   return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// function splitFullName(fullName = "") {
//   const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
//   return {
//     firstName: parts[0] || "",
//     lastName: parts.slice(1).join(" ") || "",
//   };
// }

// function toPlain(entry) {
//   return typeof entry?.toObject === "function"
//     ? entry.toObject()
//     : { ...(entry || {}) };
// }

// function buildAssignmentRecord(activity, previous = {}) {
//   return {
//     activityId: activity._id,
//     title: activity.title || "",
//     description: activity.description || "",
//     type: activity.type || "",
//     category: activity.category || "",
//     assignedAt: previous.assignedAt || new Date(),
//     status: previous.status || "ASSIGNED",
//     justification: previous.justification || "",
//     notificationRead: previous.notificationRead || false,
//     emailSent: previous.emailSent || false,
//     completedAt: previous.completedAt || null,
//     respondedAt: previous.respondedAt || null,
//     certificateUrl: previous.certificateUrl || "",
//     employeeResponse: previous.employeeResponse || "",
//   };
// }

// function upsertAssignment(list = [], activity, previous = {}) {
//   const current = Array.isArray(list) ? [...list] : [];
//   const index = current.findIndex(
//     (item) => String(item.activityId) === String(activity._id)
//   );

//   const nextRecord = buildAssignmentRecord(
//     activity,
//     index >= 0 ? toPlain(current[index]) : previous
//   );

//   if (index >= 0) {
//     current[index] = nextRecord;
//   } else {
//     current.push(nextRecord);
//   }

//   return current;
// }

// async function ensureEmployeeUser(employee) {
//   if (!employee) return null;

//   const employeeEmail = normalizeEmail(employee.email || "");
//   if (!employeeEmail) return null;

//   let existingUser = await User.findOne({ email: employeeEmail });

//   if (existingUser) {
//     let userChanged = false;
//     let employeeChanged = false;

//     if (!existingUser.password) {
//       existingUser.password = await bcrypt.hash(
//         AUTO_EMPLOYEE_TEMP_PASSWORD,
//         10
//       );
//       userChanged = true;
//     }

//     if (existingUser.role !== "EMPLOYEE") {
//       existingUser.role = "EMPLOYEE";
//       userChanged = true;
//     }

//     if (existingUser.status !== "ACTIVE") {
//       existingUser.status = "ACTIVE";
//       userChanged = true;
//     }

//     if (existingUser.isActive !== true) {
//       existingUser.isActive = true;
//       userChanged = true;
//     }

//     if (!Array.isArray(existingUser.assignedActivities)) {
//       existingUser.assignedActivities = [];
//       userChanged = true;
//     }

//     if (!employee.userId || String(employee.userId) !== String(existingUser._id)) {
//       employee.userId = existingUser._id;
//       employeeChanged = true;
//     }

//     if (userChanged) {
//       await existingUser.save();
//     }

//     if (employeeChanged) {
//       await employee.save();
//     }

//     return existingUser;
//   }

//   const createdUser = await User.create({
//     email: employeeEmail,
//     password: await bcrypt.hash(AUTO_EMPLOYEE_TEMP_PASSWORD, 10),
//     firstName: employee.firstName || "",
//     lastName: employee.lastName || "",
//     name:
//       employee.name ||
//       `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
//       employeeEmail,
//     matricule:
//       employee.matricule ||
//       (employee.csvEmployeeId ? String(employee.csvEmployeeId) : undefined),
//     role: "EMPLOYEE",
//     status: "ACTIVE",
//     isActive: true,
//     assignedActivities: [],
//   });

//   employee.userId = createdUser._id;
//   await employee.save();

//   return createdUser;
// }

// async function ensureCsvEmployeeAndUser(item) {
//   const email = normalizeEmail(item?.email || "");
//   const csvEmployeeId = Number(item?.csvEmployeeId || 0) || null;
//   const fullName = String(item?.name || "").trim();
//   const { firstName, lastName } = splitFullName(fullName);
//   const jobTitle = String(item?.jobTitle || "").trim();

//   if (!email && !csvEmployeeId && !fullName) {
//     return { employee: null, user: null };
//   }

//   let employee = null;
//   let user = null;

//   if (csvEmployeeId) {
//     employee = await Employee.findOne({ csvEmployeeId });
//   }

//   if (!employee && email) {
//     employee = await Employee.findOne({ email });
//   }

//   if (!employee && firstName && lastName) {
//     employee = await Employee.findOne({
//       firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
//       lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
//     });
//   }

//   if (!employee) {
//     const employeePayload = {
//       csvEmployeeId,
//       userId: null,
//       firstName: firstName || "",
//       lastName: lastName || "",
//       email,
//       jobTitle: jobTitle || "Employee",
//       department: "General",
//     };

//     employee = await Employee.create(employeePayload);
//   } else {
//     let employeeChanged = false;

//     if (!employee.email && email) {
//       employee.email = email;
//       employeeChanged = true;
//     }

//     if (!employee.firstName && firstName) {
//       employee.firstName = firstName;
//       employeeChanged = true;
//     }

//     if (!employee.lastName && lastName) {
//       employee.lastName = lastName;
//       employeeChanged = true;
//     }

//     if (!employee.jobTitle && jobTitle) {
//       employee.jobTitle = jobTitle;
//       employeeChanged = true;
//     }

//     if (!employee.department) {
//       employee.department = "General";
//       employeeChanged = true;
//     }

//     if (!employee.csvEmployeeId && csvEmployeeId) {
//       employee.csvEmployeeId = csvEmployeeId;
//       employeeChanged = true;
//     }

//     if (employeeChanged) {
//       await employee.save();
//     }
//   }

//   user = await ensureEmployeeUser(employee);

//   return { employee, user };
// }

// async function resolveEmployeeAndUser(item) {
//   let employee = null;
//   let user = null;

//   const csvEmployeeId = Number(item?.csvEmployeeId || 0) || null;
//   const employeeId = item?.employeeId || null;
//   const userId = item?.userId || null;
//   const email = normalizeEmail(item?.email || "");
//   const fullName = String(item?.name || "").trim();
//   const normalizedFullName = normalizeHumanText(fullName);
//   const { firstName, lastName } = splitFullName(fullName);

//   if (employeeId) {
//     employee = await Employee.findById(employeeId);
//   }

//   if (!employee && csvEmployeeId) {
//     employee = await Employee.findOne({ csvEmployeeId });
//   }

//   if (!employee && email) {
//     employee = await Employee.findOne({ email });
//   }

//   if (!employee && firstName && lastName) {
//     employee = await Employee.findOne({
//       firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
//       lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
//     });
//   }

//   if (!employee && normalizedFullName) {
//     const allEmployees = await Employee.find({}).select(
//       "firstName lastName email userId csvEmployeeId matricule jobTitle department"
//     );
//     employee =
//       allEmployees.find((e) => {
//         const empFullName = normalizeHumanText(
//           `${e.firstName || ""} ${e.lastName || ""}`.trim()
//         );
//         return empFullName && empFullName === normalizedFullName;
//       }) || null;
//   }

//   if (userId) {
//     user = await User.findById(userId);
//   }

//   if (!user && employee?.userId) {
//     user = await User.findById(employee.userId);
//   }

//   if (!user && email) {
//     user = await User.findOne({ email });
//   }

//   if (!user && firstName && lastName) {
//     user = await User.findOne({
//       firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
//       lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
//       role: "EMPLOYEE",
//     });
//   }

//   if (!employee && user?.email) {
//     employee = await Employee.findOne({ email: normalizeEmail(user.email) });
//   }

//   if (!user && employee) {
//     user = await ensureEmployeeUser(employee);
//   }

//   return { employee, user };
// }

// async function resolveActivityOwner(activity) {
//   if (activity?.createdBy) {
//     const owner = await User.findById(activity.createdBy);
//     if (owner) return owner;
//   }
//   return null;
// }

// function mergeEmployeesForConfirmation(activity, incomingEmployees = []) {
//   const storedEmployees = Array.isArray(activity?.recommendedEmployees)
//     ? activity.recommendedEmployees.map((e) => toPlain(e))
//     : [];

//   const postedEmployees = Array.isArray(incomingEmployees)
//     ? incomingEmployees.map((e) => ({ ...(e || {}) }))
//     : [];

//   if (!postedEmployees.length) {
//     return storedEmployees;
//   }

//   const normalizeKey = (item = {}) => {
//     return [
//       item.employeeId ? String(item.employeeId) : "",
//       item.userId ? String(item.userId) : "",
//       item.csvEmployeeId ? String(item.csvEmployeeId) : "",
//       normalizeEmail(item.email || ""),
//       normalizeHumanText(item.name || ""),
//     ].join("|");
//   };

//   const storedByKey = new Map(
//     storedEmployees.map((item) => [normalizeKey(item), item])
//   );

//   const merged = postedEmployees.map((posted) => {
//     const direct = storedByKey.get(normalizeKey(posted));

//     const byName =
//       direct ||
//       storedEmployees.find(
//         (stored) =>
//           normalizeHumanText(stored.name || "") &&
//           normalizeHumanText(stored.name || "") ===
//             normalizeHumanText(posted.name || "")
//       );

//     const source = byName || {};

//     return {
//       csvEmployeeId: posted.csvEmployeeId ?? source.csvEmployeeId ?? null,
//       employeeId: posted.employeeId ?? source.employeeId ?? null,
//       userId: posted.userId ?? source.userId ?? null,
//       email: posted.email || source.email || "",
//       name: posted.name || source.name || "Employé",
//       jobTitle: posted.jobTitle || source.jobTitle || "",
//       score:
//         typeof posted.score === "number"
//           ? posted.score
//           : typeof source.score === "number"
//           ? source.score
//           : Number(posted.score || source.score || 0),
//     };
//   });

//   const mergedHasLinks = merged.some(
//     (item) =>
//       item.employeeId ||
//       item.userId ||
//       item.csvEmployeeId ||
//       normalizeEmail(item.email || "")
//   );

//   if (mergedHasLinks) {
//     return merged;
//   }

//   return storedEmployees.length ? storedEmployees : merged;
// }

// exports.confirmRecommendations = async (req, res) => {
//   try {
//     const activityId = req.body?.activityId || req.body?.activity?._id;
//     if (!activityId) {
//       return res.status(400).json({ message: "activityId est requis." });
//     }

//     const activity = await Activity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ message: "Activité introuvable." });
//     }

//     const payloadEmployees = mergeEmployeesForConfirmation(
//       activity,
//       Array.isArray(req.body?.employees) ? req.body.employees : []
//     );

//     if (!payloadEmployees.length) {
//       return res.status(400).json({
//         message: "Aucun employé recommandé à confirmer.",
//       });
//     }

//     const selectedEmployees = [];
//     let sent = 0;

//     for (const item of payloadEmployees) {
//       let { employee, user } = await resolveEmployeeAndUser(item);

//       if (!employee && !user && (normalizeEmail(item.email || "") || item.csvEmployeeId || item.name)) {
//         const ensured = await ensureCsvEmployeeAndUser(item);
//         employee = ensured.employee;
//         user = ensured.user;
//       }

//       if (!employee && !user) {
//         continue;
//       }

//       const selectedRecord = {
//         csvEmployeeId: item.csvEmployeeId || employee?.csvEmployeeId || null,
//         employeeId: employee?._id || null,
//         userId: user?._id || null,
//         name:
//           item.name ||
//           `${employee?.firstName || user?.firstName || ""} ${
//             employee?.lastName || user?.lastName || ""
//           }`.trim() ||
//           user?.name ||
//           "Employé",
//         email: normalizeEmail(item.email || user?.email || employee?.email),
//         score: Number(item.score || 0),
//         status: "ASSIGNED",
//         justification: "",
//         selectedAt: new Date(),
//         respondedAt: null,
//       };

//       selectedEmployees.push(selectedRecord);

//       if (employee) {
//         employee.assignedActivities = upsertAssignment(
//           employee.assignedActivities,
//           activity,
//           { status: "ASSIGNED" }
//         );
//         await employee.save();
//       }

//       if (user) {
//         user.assignedActivities = upsertAssignment(
//           user.assignedActivities,
//           activity,
//           { status: "ASSIGNED" }
//         );
//         await user.save();
//       }

//       if (selectedRecord.email) {
//         try {
//           await sendActivityEmail({
//             to: selectedRecord.email,
//             employeeName: selectedRecord.name,
//             hrName:
//               `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() ||
//               "RH",
//             activityTitle: activity.title,
//             activityType: activity.type,
//             activityDescription: activity.description,
//             message:
//               "Merci de vous connecter à la plateforme pour accepter ou refuser cette activité.",
//             loginEmail: selectedRecord.email,
//             temporaryPassword: AUTO_EMPLOYEE_TEMP_PASSWORD,
//           });

//           sent += 1;

//           if (employee?.assignedActivities?.length) {
//             employee.assignedActivities = employee.assignedActivities.map((entry) =>
//               String(entry.activityId) === String(activity._id)
//                 ? {
//                     ...toPlain(entry),
//                     emailSent: true,
//                   }
//                 : toPlain(entry)
//             );
//             await employee.save();
//           }

//           if (user?.assignedActivities?.length) {
//             user.assignedActivities = user.assignedActivities.map((entry) =>
//               String(entry.activityId) === String(activity._id)
//                 ? {
//                     ...toPlain(entry),
//                     emailSent: true,
//                   }
//                 : toPlain(entry)
//             );
//             await user.save();
//           }
//         } catch (mailError) {
//           console.error(
//             "Email non bloquant confirmRecommendations:",
//             mailError.message
//           );
//         }
//       }
//     }

//     if (!selectedEmployees.length) {
//       return res.status(400).json({
//         message:
//           "Aucun employé recommandé ne peut être relié à un compte utilisateur.",
//       });
//     }

//     activity.recommendedEmployees = (activity.recommendedEmployees || []).map((entry) => {
//       const linked = selectedEmployees.find(
//         (s) =>
//           normalizeEmail(s.email || "") === normalizeEmail(entry?.email || "") ||
//           normalizeHumanText(s.name || "") === normalizeHumanText(entry?.name || "")
//       );

//       if (linked) {
//         return {
//           ...toPlain(entry),
//           employeeId: linked.employeeId || entry?.employeeId || null,
//           userId: linked.userId || entry?.userId || null,
//           email: linked.email || entry?.email || "",
//           matchedInMongo: Boolean(
//             linked.userId || linked.employeeId || entry?.employeeId || entry?.userId
//           ),
//           autoProvisioned: Boolean(
//             (linked.userId || linked.employeeId) &&
//             (!entry?.employeeId || !entry?.userId)
//           ),
//         };
//       }

//       return toPlain(entry);
//     });

//     activity.selectedEmployees = selectedEmployees;
//     activity.status = "IN_PROGRESS";
//     await activity.save();

//     return res.json({
//       message: "Confirmation RH enregistrée.",
//       total: selectedEmployees.length,
//       sent,
//       selectedEmployees,
//     });
//   } catch (error) {
//     console.error("confirmRecommendations error:", error);
//     return res.status(500).json({
//       message: error.message || "Erreur interne.",
//     });
//   }
// };

// exports.sendActivityNotification = exports.confirmRecommendations;

// exports.getMyActivities = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const userEmail = normalizeEmail(req.user?.email);

//     const employee =
//       (await Employee.findOne({ userId })) ||
//       (userEmail ? await Employee.findOne({ email: userEmail }) : null);

//     const sourceActivities =
//       employee?.assignedActivities?.length
//         ? employee.assignedActivities
//         : req.user?.assignedActivities || [];

//     const activityIds = sourceActivities
//       .map((item) => item.activityId)
//       .filter(Boolean);

//     const activities = await Activity.find({
//       _id: { $in: activityIds },
//     });

//     const enriched = sourceActivities.map((entry) => {
//       const activity = activities.find(
//         (a) => String(a._id) === String(entry.activityId)
//       );
//       return {
//         ...toPlain(entry),
//         activity,
//       };
//     });

//     return res.json(enriched);
//   } catch (error) {
//     console.error("getMyActivities error:", error);
//     return res.status(500).json({
//       message: error.message || "Erreur interne.",
//     });
//   }
// };

// exports.getMyNotifications = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const userEmail = normalizeEmail(req.user?.email);

//     const employee =
//       (await Employee.findOne({ userId })) ||
//       (userEmail ? await Employee.findOne({ email: userEmail }) : null);

//     const sourceActivities =
//       employee?.assignedActivities?.length
//         ? employee.assignedActivities
//         : req.user?.assignedActivities || [];

//     const notifications = sourceActivities.map((entry) => ({
//       _id: String(entry.activityId),
//       id: String(entry.activityId),
//       type: "ACTIVITY_ASSIGNED",
//       title: entry.title || "Nouvelle activité",
//       message: `Vous avez été affecté à l'activité ${entry.title || ""}`,
//       read: Boolean(entry.notificationRead),
//       isRead: Boolean(entry.notificationRead),
//       createdAt: entry.assignedAt || new Date(),
//       activityId: entry.activityId,
//       status: entry.status || "ASSIGNED",
//     }));

//     return res.json({
//       notifications,
//       unread: notifications.filter((n) => !n.read).length,
//     });
//   } catch (error) {
//     console.error("getMyNotifications error:", error);
//     return res.status(500).json({
//       message: error.message || "Erreur interne.",
//     });
//   }
// };

// exports.markAsRead = async (req, res) => {
//   try {
//     const activityId = req.params.id;
//     const userId = req.user?._id;
//     const userEmail = normalizeEmail(req.user?.email);

//     const employee =
//       (await Employee.findOne({ userId })) ||
//       (userEmail ? await Employee.findOne({ email: userEmail }) : null);

//     if (employee?.assignedActivities?.length) {
//       employee.assignedActivities = employee.assignedActivities.map((entry) =>
//         String(entry.activityId) === String(activityId)
//           ? {
//               ...toPlain(entry),
//               notificationRead: true,
//             }
//           : toPlain(entry)
//       );
//       await employee.save();
//     }

//     if (req.user?.assignedActivities?.length) {
//       req.user.assignedActivities = req.user.assignedActivities.map((entry) =>
//         String(entry.activityId) === String(activityId)
//           ? {
//               ...toPlain(entry),
//               notificationRead: true,
//             }
//           : toPlain(entry)
//       );
//       await req.user.save();
//     }

//     return res.json({ message: "Notification marquée comme lue." });
//   } catch (error) {
//     console.error("markAsRead error:", error);
//     return res.status(500).json({
//       message: error.message || "Erreur interne.",
//     });
//   }
// };

// exports.markAllAsRead = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const userEmail = normalizeEmail(req.user?.email);

//     const employee =
//       (await Employee.findOne({ userId })) ||
//       (userEmail ? await Employee.findOne({ email: userEmail }) : null);

//     if (employee?.assignedActivities?.length) {
//       employee.assignedActivities = employee.assignedActivities.map((entry) => ({
//         ...toPlain(entry),
//         notificationRead: true,
//       }));
//       await employee.save();
//     }

//     if (req.user?.assignedActivities?.length) {
//       req.user.assignedActivities = req.user.assignedActivities.map((entry) => ({
//         ...toPlain(entry),
//         notificationRead: true,
//       }));
//       await req.user.save();
//     }

//     return res.json({ message: "Toutes les notifications sont lues." });
//   } catch (error) {
//     console.error("markAllAsRead error:", error);
//     return res.status(500).json({
//       message: error.message || "Erreur interne.",
//     });
//   }
// };

// exports.respondToActivity = async (req, res) => {
//   try {
//     const {
//       activityId,
//       status,
//       justification,
//       accepted,
//       reason
//     } = req.body || {};

//     let nextStatus = String(status || "").toUpperCase();
//     const finalJustification = String(justification || reason || "");

//     if (!nextStatus) {
//       if (accepted === true) nextStatus = "ACCEPTED";
//       if (accepted === false) nextStatus = "REFUSED";
//     }

//     if (nextStatus === "DECLINED") nextStatus = "REFUSED";
//     if (nextStatus === "PENDING") nextStatus = "ASSIGNED";

//     if (!activityId || !["ACCEPTED", "REFUSED"].includes(nextStatus)) {
//       return res.status(400).json({
//         message: "activityId et status valides sont requis.",
//       });
//     }

//     const activity = await Activity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ message: "Activité introuvable." });
//     }

//     const userId = req.user?._id;
//     const userEmail = normalizeEmail(req.user?.email);

//     const employee =
//       (await Employee.findOne({ userId })) ||
//       (userEmail ? await Employee.findOne({ email: userEmail }) : null);

//     if (employee?.assignedActivities?.length) {
//       employee.assignedActivities = employee.assignedActivities.map((entry) =>
//         String(entry.activityId) === String(activityId)
//           ? {
//               ...toPlain(entry),
//               status: nextStatus,
//               justification: nextStatus === "REFUSED" ? finalJustification : "",
//               employeeResponse:
//                 nextStatus === "REFUSED" ? finalJustification : "ACCEPTED",
//               respondedAt: new Date(),
//               notificationRead: true,
//             }
//           : toPlain(entry)
//       );
//       await employee.save();
//     }

//     if (req.user?.assignedActivities?.length) {
//       req.user.assignedActivities = req.user.assignedActivities.map((entry) =>
//         String(entry.activityId) === String(activityId)
//           ? {
//               ...toPlain(entry),
//               status: nextStatus,
//               justification: nextStatus === "REFUSED" ? finalJustification : "",
//               employeeResponse:
//                 nextStatus === "REFUSED" ? finalJustification : "ACCEPTED",
//               respondedAt: new Date(),
//               notificationRead: true,
//             }
//           : toPlain(entry)
//       );
//       await req.user.save();
//     }

//     const normalizedUserEmail = normalizeEmail(req.user?.email);

//     activity.selectedEmployees = (activity.selectedEmployees || []).map((entry) => {
//       const sameUserId =
//         String(entry.userId || "") === String(userId || "") &&
//         String(entry.userId || "") !== "";

//       const sameEmployeeId =
//         employee?._id &&
//         String(entry.employeeId || "") === String(employee._id);

//       const sameEmail =
//         normalizeEmail(entry.email || "") === normalizedUserEmail &&
//         normalizedUserEmail !== "";

//       if (sameUserId || sameEmployeeId || sameEmail) {
//         return {
//           ...toPlain(entry),
//           status: nextStatus === "REFUSED" ? "DECLINED" : "ACCEPTED",
//           justification: nextStatus === "REFUSED" ? finalJustification : "",
//           respondedAt: new Date(),
//         };
//       }

//       return toPlain(entry);
//     });

//     await activity.save();

//     try {
//       const owner = await resolveActivityOwner(activity);
//       const targetEmail =
//         normalizeEmail(owner?.email) || normalizeEmail(process.env.EMAIL_USER);

//       if (targetEmail) {
//         await sendResponseEmail({
//           to: targetEmail,
//           hrName: `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim() || "RH",
//           employeeName:
//             `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() ||
//             req.user?.email ||
//             "Employé",
//           activityTitle: activity.title,
//           accepted: nextStatus === "ACCEPTED",
//           justification: nextStatus === "REFUSED" ? finalJustification : "",
//         });
//       } else {
//         console.warn("Aucun email RH/manager trouvé pour envoyer la réponse employé.");
//       }
//     } catch (mailError) {
//       console.error("sendResponseEmail non bloquante:", mailError.message);
//     }

//     return res.json({
//       message: "Réponse enregistrée.",
//       status: nextStatus,
//     });
//   } catch (error) {
//     console.error("respondToActivity error:", error);
//     return res.status(500).json({
//       message: error.message || "Erreur interne.",
//     });
//   }
// };

// exports.completeActivity = async (req, res) => {
//   try {
//     const { activityId } = req.body || {};
//     if (!activityId) {
//       return res.status(400).json({ message: "activityId est requis." });
//     }

//     const activity = await Activity.findById(activityId);
//     if (!activity) {
//       return res.status(404).json({ message: "Activité introuvable." });
//     }

//     const userId = req.user?._id;
//     const userEmail = normalizeEmail(req.user?.email);

//     const employee =
//       (await Employee.findOne({ userId })) ||
//       (userEmail ? await Employee.findOne({ email: userEmail }) : null);

//     if (employee?.assignedActivities?.length) {
//       employee.assignedActivities = employee.assignedActivities.map((entry) =>
//         String(entry.activityId) === String(activityId)
//           ? {
//               ...toPlain(entry),
//               status: "COMPLETED",
//               completedAt: new Date(),
//               respondedAt: new Date(),
//             }
//           : toPlain(entry)
//       );
//       await employee.save();
//     }

//     if (req.user?.assignedActivities?.length) {
//       req.user.assignedActivities = req.user.assignedActivities.map((entry) =>
//         String(entry.activityId) === String(activityId)
//           ? {
//               ...toPlain(entry),
//               status: "COMPLETED",
//               completedAt: new Date(),
//               respondedAt: new Date(),
//             }
//           : toPlain(entry)
//       );
//       await req.user.save();
//     }

//     activity.selectedEmployees = (activity.selectedEmployees || []).map((entry) => {
//       const sameUserId =
//         String(entry.userId || "") === String(userId || "") &&
//         String(entry.userId || "") !== "";

//       const sameEmployeeId =
//         employee?._id &&
//         String(entry.employeeId || "") === String(employee._id);

//       const sameEmail =
//         normalizeEmail(entry.email || "") === userEmail &&
//         userEmail !== "";

//       if (sameUserId || sameEmployeeId || sameEmail) {
//         return {
//           ...toPlain(entry),
//           status: "COMPLETED",
//           respondedAt: new Date(),
//         };
//       }

//       return toPlain(entry);
//     });

//     await activity.save();

//     return res.json({ message: "Activité marquée comme terminée." });
//   } catch (error) {
//     console.error("completeActivity error:", error);
//     return res.status(500).json({
//       message: error.message || "Erreur interne.",
//     });
//   }
// };

// exports.getPendingTrainings = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     const userEmail = normalizeEmail(req.user?.email);

//     const employee =
//       (await Employee.findOne({ userId })) ||
//       (userEmail ? await Employee.findOne({ email: userEmail }) : null);

//     const sourceActivities =
//       employee?.assignedActivities?.length
//         ? employee.assignedActivities
//         : req.user?.assignedActivities || [];

//     const pending = sourceActivities.filter(
//       (entry) => entry.type === "TRAINING" && entry.status === "ASSIGNED"
//     );

//     return res.json(pending);
//   } catch (error) {
//     console.error("getPendingTrainings error:", error);
//     return res.status(500).json({
//       message: error.message || "Erreur interne.",
//     });
//   }
// };

// exports.getManagerApprovals = async (_req, res) => {
//   return res.json([]);
// };

// exports.handleApproval = async (_req, res) => {
//   return res.json({
//     message: "Aucune validation manager spécifique implémentée.",
//   });
// };
const bcrypt = require("bcryptjs");
const Activity = require("../models/Activity");
const Employee = require("../models/Employee");
const User = require("../models/User");
const {
  sendActivityEmail,
  sendResponseEmail,
} = require("../services/emailNotification.service");

const AUTO_EMPLOYEE_TEMP_PASSWORD =
  process.env.AUTO_EMPLOYEE_TEMP_PASSWORD || "123456";

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeHumanText(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeRegex(value = "") {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function splitFullName(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function toPlain(entry) {
  return typeof entry?.toObject === "function"
    ? entry.toObject()
    : { ...(entry || {}) };
}

function buildAssignmentRecord(activity, previous = {}) {
  return {
    activityId: activity._id,
    title: activity.title || "",
    description: activity.description || "",
    type: activity.type || "",
    category: activity.category || "",
    assignedAt: previous.assignedAt || new Date(),
    status: previous.status || "ASSIGNED",
    justification: previous.justification || "",
    notificationRead: previous.notificationRead || false,
    emailSent: previous.emailSent || false,
    completedAt: previous.completedAt || null,
    respondedAt: previous.respondedAt || null,
    certificateUrl: previous.certificateUrl || "",
    employeeResponse: previous.employeeResponse || "",
  };
}

function upsertAssignment(list = [], activity, previous = {}) {
  const current = Array.isArray(list) ? [...list] : [];
  const index = current.findIndex(
    (item) => String(item.activityId) === String(activity._id)
  );

  const nextRecord = buildAssignmentRecord(
    activity,
    index >= 0 ? toPlain(current[index]) : previous
  );

  if (index >= 0) {
    current[index] = nextRecord;
  } else {
    current.push(nextRecord);
  }

  return current;
}

function isActivityFinished(activity) {
  if (!activity?.endDate) return false;
  return new Date() >= new Date(activity.endDate);
}

async function ensureEmployeeUser(employee) {
  if (!employee) return null;

  const employeeEmail = normalizeEmail(employee.email || "");
  if (!employeeEmail) return null;

  let existingUser = await User.findOne({ email: employeeEmail });

  if (existingUser) {
    let userChanged = false;
    let employeeChanged = false;

    if (!existingUser.password) {
      existingUser.password = await bcrypt.hash(
        AUTO_EMPLOYEE_TEMP_PASSWORD,
        10
      );
      userChanged = true;
    }

    if (existingUser.role !== "EMPLOYEE") {
      existingUser.role = "EMPLOYEE";
      userChanged = true;
    }

    if (existingUser.status !== "ACTIVE") {
      existingUser.status = "ACTIVE";
      userChanged = true;
    }

    if (existingUser.isActive !== true) {
      existingUser.isActive = true;
      userChanged = true;
    }

    if (!Array.isArray(existingUser.assignedActivities)) {
      existingUser.assignedActivities = [];
      userChanged = true;
    }

    if (!employee.userId || String(employee.userId) !== String(existingUser._id)) {
      employee.userId = existingUser._id;
      employeeChanged = true;
    }

    if (userChanged) {
      await existingUser.save();
    }

    if (employeeChanged) {
      await employee.save();
    }

    return existingUser;
  }

  const createdUser = await User.create({
    email: employeeEmail,
    password: await bcrypt.hash(AUTO_EMPLOYEE_TEMP_PASSWORD, 10),
    firstName: employee.firstName || "",
    lastName: employee.lastName || "",
    name:
      `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
      employeeEmail,
    matricule:
      employee.matricule ||
      (employee.csvEmployeeId ? String(employee.csvEmployeeId) : undefined),
    role: "EMPLOYEE",
    status: "ACTIVE",
    isActive: true,
    assignedActivities: [],
  });

  employee.userId = createdUser._id;
  await employee.save();

  return createdUser;
}

async function ensureCsvEmployeeAndUser(item) {
  const email = normalizeEmail(item?.email || "");
  const csvEmployeeId = Number(item?.csvEmployeeId || 0) || null;
  const fullName = String(item?.name || "").trim();
  const { firstName, lastName } = splitFullName(fullName);
  const jobTitle = String(item?.jobTitle || "").trim();

  if (!email && !csvEmployeeId && !fullName) {
    return { employee: null, user: null };
  }

  let employee = null;
  let user = null;

  if (csvEmployeeId) {
    employee = await Employee.findOne({ csvEmployeeId });
  }

  if (!employee && email) {
    employee = await Employee.findOne({ email });
  }

  if (!employee && firstName && lastName) {
    employee = await Employee.findOne({
      firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
      lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
    });
  }

  if (!employee) {
    employee = await Employee.create({
      csvEmployeeId,
      userId: null,
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      jobTitle: jobTitle || "Employee",
      department: "General",
    });
  } else {
    let employeeChanged = false;

    if (!employee.email && email) {
      employee.email = email;
      employeeChanged = true;
    }

    if (!employee.firstName && firstName) {
      employee.firstName = firstName;
      employeeChanged = true;
    }

    if (!employee.lastName && lastName) {
      employee.lastName = lastName;
      employeeChanged = true;
    }

    if (!employee.jobTitle && jobTitle) {
      employee.jobTitle = jobTitle;
      employeeChanged = true;
    }

    if (!employee.department) {
      employee.department = "General";
      employeeChanged = true;
    }

    if (!employee.csvEmployeeId && csvEmployeeId) {
      employee.csvEmployeeId = csvEmployeeId;
      employeeChanged = true;
    }

    if (employeeChanged) {
      await employee.save();
    }
  }

  user = await ensureEmployeeUser(employee);

  return { employee, user };
}

async function resolveEmployeeAndUser(item) {
  let employee = null;
  let user = null;

  const csvEmployeeId = Number(item?.csvEmployeeId || 0) || null;
  const employeeId = item?.employeeId || null;
  const userId = item?.userId || null;
  const email = normalizeEmail(item?.email || "");
  const fullName = String(item?.name || "").trim();
  const normalizedFullName = normalizeHumanText(fullName);
  const { firstName, lastName } = splitFullName(fullName);

  if (employeeId) {
    employee = await Employee.findById(employeeId);
  }

  if (!employee && csvEmployeeId) {
    employee = await Employee.findOne({ csvEmployeeId });
  }

  if (!employee && email) {
    employee = await Employee.findOne({ email });
  }

  if (!employee && firstName && lastName) {
    employee = await Employee.findOne({
      firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
      lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
    });
  }

  if (!employee && normalizedFullName) {
    const allEmployees = await Employee.find({}).select(
      "firstName lastName email userId csvEmployeeId matricule jobTitle department"
    );
    employee =
      allEmployees.find((e) => {
        const empFullName = normalizeHumanText(
          `${e.firstName || ""} ${e.lastName || ""}`.trim()
        );
        return empFullName && empFullName === normalizedFullName;
      }) || null;
  }

  if (userId) {
    user = await User.findById(userId);
  }

  if (!user && employee?.userId) {
    user = await User.findById(employee.userId);
  }

  if (!user && email) {
    user = await User.findOne({ email });
  }

  if (!user && firstName && lastName) {
    user = await User.findOne({
      firstName: { $regex: new RegExp(`^${escapeRegex(firstName)}$`, "i") },
      lastName: { $regex: new RegExp(`^${escapeRegex(lastName)}$`, "i") },
      role: "EMPLOYEE",
    });
  }

  if (!employee && user?.email) {
    employee = await Employee.findOne({ email: normalizeEmail(user.email) });
  }

  if (!user && employee) {
    user = await ensureEmployeeUser(employee);
  }

  return { employee, user };
}

async function resolveActivityOwner(activity) {
  if (activity?.createdBy) {
    const owner = await User.findById(activity.createdBy);
    if (owner) return owner;
  }
  return null;
}

function mergeEmployeesForConfirmation(activity, incomingEmployees = []) {
  const storedEmployees = Array.isArray(activity?.recommendedEmployees)
    ? activity.recommendedEmployees.map((e) => toPlain(e))
    : [];

  const postedEmployees = Array.isArray(incomingEmployees)
    ? incomingEmployees.map((e) => ({ ...(e || {}) }))
    : [];

  if (!postedEmployees.length) {
    return storedEmployees;
  }

  const normalizeKey = (item = {}) => {
    return [
      item.employeeId ? String(item.employeeId) : "",
      item.userId ? String(item.userId) : "",
      item.csvEmployeeId ? String(item.csvEmployeeId) : "",
      normalizeEmail(item.email || ""),
      normalizeHumanText(item.name || ""),
    ].join("|");
  };

  const storedByKey = new Map(
    storedEmployees.map((item) => [normalizeKey(item), item])
  );

  const merged = postedEmployees.map((posted) => {
    const direct = storedByKey.get(normalizeKey(posted));

    const byName =
      direct ||
      storedEmployees.find(
        (stored) =>
          normalizeHumanText(stored.name || "") &&
          normalizeHumanText(stored.name || "") ===
            normalizeHumanText(posted.name || "")
      );

    const source = byName || {};

    return {
      csvEmployeeId: posted.csvEmployeeId ?? source.csvEmployeeId ?? null,
      employeeId: posted.employeeId ?? source.employeeId ?? null,
      userId: posted.userId ?? source.userId ?? null,
      email: posted.email || source.email || "",
      name: posted.name || source.name || "Employé",
      jobTitle: posted.jobTitle || source.jobTitle || "",
      score:
        typeof posted.score === "number"
          ? posted.score
          : typeof source.score === "number"
          ? source.score
          : Number(posted.score || source.score || 0),
    };
  });

  const mergedHasLinks = merged.some(
    (item) =>
      item.employeeId ||
      item.userId ||
      item.csvEmployeeId ||
      normalizeEmail(item.email || "")
  );

  if (mergedHasLinks) {
    return merged;
  }

  return storedEmployees.length ? storedEmployees : merged;
}

exports.confirmRecommendations = async (req, res) => {
  try {
    const activityId = req.body?.activityId || req.body?.activity?._id;
    if (!activityId) {
      return res.status(400).json({ message: "activityId est requis." });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: "Activité introuvable." });
    }

    const payloadEmployees = mergeEmployeesForConfirmation(
      activity,
      Array.isArray(req.body?.employees) ? req.body.employees : []
    );

    if (!payloadEmployees.length) {
      return res.status(400).json({
        message: "Aucun employé recommandé à confirmer.",
      });
    }

    const selectedEmployees = [];
    let sent = 0;

    for (const item of payloadEmployees) {
      let { employee, user } = await resolveEmployeeAndUser(item);

      if (!employee && !user && (normalizeEmail(item.email || "") || item.csvEmployeeId || item.name)) {
        const ensured = await ensureCsvEmployeeAndUser(item);
        employee = ensured.employee;
        user = ensured.user;
      }

      if (!employee && !user) {
        continue;
      }

      const selectedRecord = {
        csvEmployeeId: item.csvEmployeeId || employee?.csvEmployeeId || null,
        employeeId: employee?._id || null,
        userId: user?._id || null,
        name:
          item.name ||
          `${employee?.firstName || user?.firstName || ""} ${employee?.lastName || user?.lastName || ""}`.trim() ||
          user?.name ||
          "Employé",
        email: normalizeEmail(item.email || user?.email || employee?.email),
        score: Number(item.score || 0),
        status: "ASSIGNED",
        justification: "",
        selectedAt: new Date(),
        respondedAt: null,
      };

      selectedEmployees.push(selectedRecord);

      if (employee) {
        employee.assignedActivities = upsertAssignment(
          employee.assignedActivities,
          activity,
          { status: "ASSIGNED" }
        );
        await employee.save();
      }

      if (user) {
        user.assignedActivities = upsertAssignment(
          user.assignedActivities,
          activity,
          { status: "ASSIGNED" }
        );
        await user.save();
      }

      if (selectedRecord.email) {
        try {
          await sendActivityEmail({
            to: selectedRecord.email,
            employeeName: selectedRecord.name,
            hrName:
              `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() ||
              "RH",
            activityTitle: activity.title,
            activityType: activity.type,
            activityDescription: activity.description,
            message:
              "Merci de vous connecter à la plateforme pour accepter ou refuser cette activité.",
            loginEmail: selectedRecord.email,
            temporaryPassword: AUTO_EMPLOYEE_TEMP_PASSWORD,
          });

          sent += 1;

          if (employee?.assignedActivities?.length) {
            employee.assignedActivities = employee.assignedActivities.map((entry) =>
              String(entry.activityId) === String(activity._id)
                ? {
                    ...toPlain(entry),
                    emailSent: true,
                  }
                : toPlain(entry)
            );
            await employee.save();
          }

          if (user?.assignedActivities?.length) {
            user.assignedActivities = user.assignedActivities.map((entry) =>
              String(entry.activityId) === String(activity._id)
                ? {
                    ...toPlain(entry),
                    emailSent: true,
                  }
                : toPlain(entry)
            );
            await user.save();
          }
        } catch (mailError) {
          console.error(
            "Email non bloquant confirmRecommendations:",
            mailError.message
          );
        }
      }
    }

    if (!selectedEmployees.length) {
      return res.status(400).json({
        message:
          "Aucun employé recommandé ne peut être relié à un compte utilisateur.",
      });
    }

    activity.recommendedEmployees = (activity.recommendedEmployees || []).map((entry) => {
      const linked = selectedEmployees.find(
        (s) =>
          normalizeEmail(s.email || "") === normalizeEmail(entry?.email || "") ||
          normalizeHumanText(s.name || "") === normalizeHumanText(entry?.name || "")
      );

      if (linked) {
        return {
          ...toPlain(entry),
          employeeId: linked.employeeId || entry?.employeeId || null,
          userId: linked.userId || entry?.userId || null,
          email: linked.email || entry?.email || "",
          matchedInMongo: Boolean(
            linked.userId || linked.employeeId || entry?.employeeId || entry?.userId
          ),
          autoProvisioned: Boolean(
            (linked.userId || linked.employeeId) &&
            (!entry?.employeeId || !entry?.userId)
          ),
        };
      }

      return toPlain(entry);
    });

    activity.selectedEmployees = selectedEmployees;
    activity.status = "IN_PROGRESS";
    await activity.save();

    return res.json({
      message: "Confirmation RH enregistrée.",
      total: selectedEmployees.length,
      sent,
      selectedEmployees,
    });
  } catch (error) {
    console.error("confirmRecommendations error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne.",
    });
  }
};

exports.sendActivityNotification = exports.confirmRecommendations;

exports.getMyActivities = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userEmail = normalizeEmail(req.user?.email);

    const employee =
      (await Employee.findOne({ userId })) ||
      (userEmail ? await Employee.findOne({ email: userEmail }) : null);

    const sourceActivities =
      employee?.assignedActivities?.length
        ? employee.assignedActivities
        : req.user?.assignedActivities || [];

    const activityIds = sourceActivities
      .map((item) => item.activityId)
      .filter(Boolean);

    const activities = await Activity.find({
      _id: { $in: activityIds },
    });

    const enriched = sourceActivities.map((entry) => {
      const activity = activities.find(
        (a) => String(a._id) === String(entry.activityId)
      );
      return {
        ...toPlain(entry),
        activity,
      };
    });

    return res.json(enriched);
  } catch (error) {
    console.error("getMyActivities error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne.",
    });
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userEmail = normalizeEmail(req.user?.email);

    const employee =
      (await Employee.findOne({ userId })) ||
      (userEmail ? await Employee.findOne({ email: userEmail }) : null);

    const sourceActivities =
      employee?.assignedActivities?.length
        ? employee.assignedActivities
        : req.user?.assignedActivities || [];

    const notifications = sourceActivities.map((entry) => ({
      _id: String(entry.activityId),
      id: String(entry.activityId),
      type: "ACTIVITY_ASSIGNED",
      title: entry.title || "Nouvelle activité",
      message: `Vous avez été affecté à l'activité ${entry.title || ""}`,
      read: Boolean(entry.notificationRead),
      isRead: Boolean(entry.notificationRead),
      createdAt: entry.assignedAt || new Date(),
      activityId: entry.activityId,
      status: entry.status || "ASSIGNED",
    }));

    return res.json({
      notifications,
      unread: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne.",
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const activityId = req.params.id;
    const userId = req.user?._id;
    const userEmail = normalizeEmail(req.user?.email);

    const employee =
      (await Employee.findOne({ userId })) ||
      (userEmail ? await Employee.findOne({ email: userEmail }) : null);

    if (employee?.assignedActivities?.length) {
      employee.assignedActivities = employee.assignedActivities.map((entry) =>
        String(entry.activityId) === String(activityId)
          ? {
              ...toPlain(entry),
              notificationRead: true,
            }
          : toPlain(entry)
      );
      await employee.save();
    }

    if (req.user?.assignedActivities?.length) {
      req.user.assignedActivities = req.user.assignedActivities.map((entry) =>
        String(entry.activityId) === String(activityId)
          ? {
              ...toPlain(entry),
              notificationRead: true,
            }
          : toPlain(entry)
      );
      await req.user.save();
    }

    return res.json({ message: "Notification marquée comme lue." });
  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne.",
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userEmail = normalizeEmail(req.user?.email);

    const employee =
      (await Employee.findOne({ userId })) ||
      (userEmail ? await Employee.findOne({ email: userEmail }) : null);

    if (employee?.assignedActivities?.length) {
      employee.assignedActivities = employee.assignedActivities.map((entry) => ({
        ...toPlain(entry),
        notificationRead: true,
      }));
      await employee.save();
    }

    if (req.user?.assignedActivities?.length) {
      req.user.assignedActivities = req.user.assignedActivities.map((entry) => ({
        ...toPlain(entry),
        notificationRead: true,
      }));
      await req.user.save();
    }

    return res.json({ message: "Toutes les notifications sont lues." });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne.",
    });
  }
};

exports.respondToActivity = async (req, res) => {
  try {
    const {
      activityId,
      status,
      justification,
      accepted,
      reason
    } = req.body || {};

    let nextStatus = String(status || "").toUpperCase();
    const finalJustification = String(justification || reason || "");

    if (!nextStatus) {
      if (accepted === true) nextStatus = "ACCEPTED";
      if (accepted === false) nextStatus = "REFUSED";
    }

    if (nextStatus === "DECLINED") nextStatus = "REFUSED";
    if (nextStatus === "PENDING") nextStatus = "ASSIGNED";

    if (!activityId || !["ACCEPTED", "REFUSED"].includes(nextStatus)) {
      return res.status(400).json({
        message: "activityId et status valides sont requis.",
      });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: "Activité introuvable." });
    }

    const userId = req.user?._id;
    const userEmail = normalizeEmail(req.user?.email);

    const employee =
      (await Employee.findOne({ userId })) ||
      (userEmail ? await Employee.findOne({ email: userEmail }) : null);

    if (employee?.assignedActivities?.length) {
      employee.assignedActivities = employee.assignedActivities.map((entry) =>
        String(entry.activityId) === String(activityId)
          ? {
              ...toPlain(entry),
              status: nextStatus,
              justification: nextStatus === "REFUSED" ? finalJustification : "",
              employeeResponse:
                nextStatus === "REFUSED" ? finalJustification : "ACCEPTED",
              respondedAt: new Date(),
              notificationRead: true,
            }
          : toPlain(entry)
      );
      await employee.save();
    }

    if (req.user?.assignedActivities?.length) {
      req.user.assignedActivities = req.user.assignedActivities.map((entry) =>
        String(entry.activityId) === String(activityId)
          ? {
              ...toPlain(entry),
              status: nextStatus,
              justification: nextStatus === "REFUSED" ? finalJustification : "",
              employeeResponse:
                nextStatus === "REFUSED" ? finalJustification : "ACCEPTED",
              respondedAt: new Date(),
              notificationRead: true,
            }
          : toPlain(entry)
      );
      await req.user.save();
    }

    const normalizedUserEmail = normalizeEmail(req.user?.email);

    activity.selectedEmployees = (activity.selectedEmployees || []).map((entry) => {
      const sameUserId =
        String(entry.userId || "") === String(userId || "") &&
        String(entry.userId || "") !== "";

      const sameEmployeeId =
        employee?._id &&
        String(entry.employeeId || "") === String(employee._id);

      const sameEmail =
        normalizeEmail(entry.email || "") === normalizedUserEmail &&
        normalizedUserEmail !== "";

      if (sameUserId || sameEmployeeId || sameEmail) {
        return {
          ...toPlain(entry),
          status: nextStatus === "REFUSED" ? "DECLINED" : "ACCEPTED",
          justification: nextStatus === "REFUSED" ? finalJustification : "",
          respondedAt: new Date(),
        };
      }

      return toPlain(entry);
    });

    await activity.save();

    try {
      const owner = await resolveActivityOwner(activity);
      const targetEmail =
        normalizeEmail(owner?.email) || normalizeEmail(process.env.EMAIL_USER);

      if (targetEmail) {
        await sendResponseEmail({
          to: targetEmail,
          hrName: `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim() || "RH",
          employeeName:
            `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() ||
            req.user?.email ||
            "Employé",
          activityTitle: activity.title,
          accepted: nextStatus === "ACCEPTED",
          justification: nextStatus === "REFUSED" ? finalJustification : "",
        });
      } else {
        console.warn("Aucun email RH/manager trouvé pour envoyer la réponse employé.");
      }
    } catch (mailError) {
      console.error("sendResponseEmail non bloquante:", mailError.message);
    }

    return res.json({
      message: "Réponse enregistrée.",
      status: nextStatus,
    });
  } catch (error) {
    console.error("respondToActivity error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne.",
    });
  }
};

exports.completeActivity = async (req, res) => {
  try {
    const { activityId } = req.body || {};
    if (!activityId) {
      return res.status(400).json({ message: "activityId est requis." });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: "Activité introuvable." });
    }

    if (activity.type !== "TRAINING") {
      return res.status(400).json({
        message: "Seules les formations peuvent être terminées avec cette action."
      });
    }

    if (!isActivityFinished(activity)) {
      return res.status(400).json({
        message: "La durée de cette activité n'est pas encore terminée."
      });
    }

    const userId = req.user?._id;
    const userEmail = normalizeEmail(req.user?.email);

    const employee =
      (await Employee.findOne({ userId })) ||
      (userEmail ? await Employee.findOne({ email: userEmail }) : null);

    if (employee?.assignedActivities?.length) {
      employee.assignedActivities = employee.assignedActivities.map((entry) =>
        String(entry.activityId) === String(activityId)
          ? {
              ...toPlain(entry),
              status: "COMPLETED",
              completedAt: new Date(),
              respondedAt: new Date()
            }
          : toPlain(entry)
      );
      await employee.save();
    }

    if (req.user?.assignedActivities?.length) {
      req.user.assignedActivities = req.user.assignedActivities.map((entry) =>
        String(entry.activityId) === String(activityId)
          ? {
              ...toPlain(entry),
              status: "COMPLETED",
              completedAt: new Date(),
              respondedAt: new Date()
            }
          : toPlain(entry)
      );
      await req.user.save();
    }

    activity.selectedEmployees = (activity.selectedEmployees || []).map((entry) => {
      const sameUserId =
        String(entry.userId || "") === String(userId || "") &&
        String(entry.userId || "") !== "";

      const sameEmployeeId =
        employee?._id &&
        String(entry.employeeId || "") === String(employee._id);

      const sameEmail =
        normalizeEmail(entry.email || "") === userEmail &&
        userEmail !== "";

      if (sameUserId || sameEmployeeId || sameEmail) {
        return {
          ...toPlain(entry),
          status: "COMPLETED",
          respondedAt: new Date()
        };
      }

      return toPlain(entry);
    });

    await activity.save();

    return res.json({
      message: "Formation terminée. En attente de validation RH.",
      status: "COMPLETED"
    });
  } catch (error) {
    console.error("completeActivity error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne."
    });
  }
};

exports.getCertificationApprovals = async (req, res) => {
  try {
    const activities = await Activity.find({
      type: "TRAINING",
      selectedEmployees: { $exists: true, $ne: [] }
    }).lean();

    const rows = [];

    for (const activity of activities) {
      const selectedEmployees = Array.isArray(activity.selectedEmployees)
        ? activity.selectedEmployees
        : [];

      for (const entry of selectedEmployees) {
        if (String(entry.status || "").toUpperCase() !== "COMPLETED") continue;

        rows.push({
          activityId: String(activity._id),
          activityTitle: activity.title || "",
          employeeId: entry.employeeId || null,
          userId: entry.userId || null,
          employeeName: entry.name || "Employé",
          employeeEmail: entry.email || "",
          completedAt: entry.respondedAt || entry.selectedAt || null,
          status: entry.status || "COMPLETED"
        });
      }
    }

    rows.sort((a, b) => {
      const da = new Date(a.completedAt || 0).getTime();
      const db = new Date(b.completedAt || 0).getTime();
      return db - da;
    });

    return res.json(rows);
  } catch (error) {
    console.error("getCertificationApprovals error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne."
    });
  }
};

exports.approveCertification = async (req, res) => {
  try {
    const { activityId, userId, employeeId, certificateUrl } = req.body || {};

    if (!activityId) {
      return res.status(400).json({ message: "activityId est requis." });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: "Activité introuvable." });
    }

    const user = userId ? await User.findById(userId) : null;
    const employee = employeeId ? await Employee.findById(employeeId) : null;

    if (employee?.assignedActivities?.length) {
      employee.assignedActivities = employee.assignedActivities.map((entry) =>
        String(entry.activityId) === String(activityId)
          ? {
              ...toPlain(entry),
              status: "CERTIFIED",
              completedAt: entry.completedAt || new Date(),
              respondedAt: new Date(),
              certificateUrl: certificateUrl || entry.certificateUrl || ""
            }
          : toPlain(entry)
      );
      await employee.save();
    }

    if (user?.assignedActivities?.length) {
      user.assignedActivities = user.assignedActivities.map((entry) =>
        String(entry.activityId) === String(activityId)
          ? {
              ...toPlain(entry),
              status: "CERTIFIED",
              completedAt: entry.completedAt || new Date(),
              respondedAt: new Date(),
              certificateUrl: certificateUrl || entry.certificateUrl || ""
            }
          : toPlain(entry)
      );
      await user.save();
    }

    activity.selectedEmployees = (activity.selectedEmployees || []).map((entry) => {
      const sameUserId =
        userId &&
        String(entry.userId || "") === String(userId);

      const sameEmployeeId =
        employeeId &&
        String(entry.employeeId || "") === String(employeeId);

      if (sameUserId || sameEmployeeId) {
        return {
          ...toPlain(entry),
          status: "CERTIFIED",
          respondedAt: new Date()
        };
      }

      return toPlain(entry);
    });

    await activity.save();

    return res.json({
      message: "Certification validée par RH.",
      status: "CERTIFIED"
    });
  } catch (error) {
    console.error("approveCertification error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne."
    });
  }
};

exports.getPendingTrainings = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userEmail = normalizeEmail(req.user?.email);

    const employee =
      (await Employee.findOne({ userId })) ||
      (userEmail ? await Employee.findOne({ email: userEmail }) : null);

    const sourceActivities =
      employee?.assignedActivities?.length
        ? employee.assignedActivities
        : req.user?.assignedActivities || [];

    const pending = sourceActivities.filter(
      (entry) => entry.type === "TRAINING" && entry.status === "ASSIGNED"
    );

    return res.json(pending);
  } catch (error) {
    console.error("getPendingTrainings error:", error);
    return res.status(500).json({
      message: error.message || "Erreur interne."
    });
  }
};

exports.getManagerApprovals = async (_req, res) => {
  return res.json([]);
};

exports.handleApproval = async (_req, res) => {
  return res.json({
    message: "Aucune validation manager spécifique implémentée."
  });
};