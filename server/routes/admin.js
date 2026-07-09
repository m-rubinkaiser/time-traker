const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getStats,
  getUsers,
  editUser,
  toggleUserSuspension,
  deleteUser,
  resetPassword,
  getAllProjects,
  deleteProject,
  getProjectTasks,
  getTokenConfig,
  updateTokenConfig,
  regenerateSigningKey,
  revokeUserToken,
  forceLogoutAll,
  extendSubscription,
  cancelSubscription,
  getAllSubscriptions
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.route('/users/:id')
  .put(editUser)
  .delete(deleteUser);

router.put('/users/:id/suspend', toggleUserSuspension);
router.put('/users/:id/reset-password', resetPassword);
router.post('/users/:id/revoke-token', revokeUserToken);
router.put('/users/:id/subscription/extend', extendSubscription);
router.put('/users/:id/subscription/cancel', cancelSubscription);

router.get('/projects', getAllProjects);
router.delete('/projects/:id', deleteProject);
router.get('/projects/:id/tasks', getProjectTasks);

router.route('/token-config')
  .get(getTokenConfig)
  .put(updateTokenConfig);

router.post('/regenerate-secret', regenerateSigningKey);
router.post('/force-logout-all', forceLogoutAll);
router.get('/subscriptions', getAllSubscriptions);

module.exports = router;
