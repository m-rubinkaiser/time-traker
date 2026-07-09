const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // true for port 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a list of pending/in-progress tasks to a user.
 * @param {string} toEmail 
 * @param {string} userName 
 * @param {Array} tasks 
 */
const sendPendingTasksEmail = async (toEmail, userName, tasks) => {
  if (!tasks || tasks.length === 0) return;

  const tasksListHtml = tasks.map(t => {
    let priorityColor = '#3b82f6'; // default
    if (t.priority === 'urgent') priorityColor = '#ef4444';
    else if (t.priority === 'high') priorityColor = '#f97316';
    else if (t.priority === 'medium') priorityColor = '#eab308';

    const projectColor = t.projectId?.color || '#a855f7';
    const projectName = t.projectId?.name || 'General';

    return `
      <tr style="border-bottom: 1px solid rgba(0, 0, 0, 0.05);">
        <td style="padding: 12px; font-weight: 600; color: #1e293b;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${projectColor}; margin-right: 6px;"></span>
          ${projectName}
        </td>
        <td style="padding: 12px; color: #334155;">
          <strong>${t.title}</strong>
          ${t.description ? `<br/><span style="font-size: 12px; color: #64748b;">${t.description}</span>` : ''}
        </td>
        <td style="padding: 12px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; border-radius: 12px; background-color: ${priorityColor}1a; color: ${priorityColor}; text-transform: uppercase;">
            ${t.priority}
          </span>
        </td>
        <td style="padding: 12px; color: #64748b; font-size: 13px;">
          ${new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Pending Tasks Summary</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02); overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 32px 24px; color: #ffffff; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 32px 24px; }
        .welcome { font-size: 16px; color: #1e293b; margin-bottom: 20px; line-height: 1.5; }
        .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .table th { background-color: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .footer a { color: #4f46e5; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Pending Tasks Reminder</h1>
          <p>TimeTrack Daily Morning Update</p>
        </div>
        <div class="content">
          <div class="welcome">
            Hi <strong>${userName}</strong>,<br/>
            Here is the list of your tasks that are currently pending or in-progress. Let's get things checked off today!
          </div>
          <table class="table">
            <thead>
              <tr>
                <th style="width: 25%;">Project</th>
                <th style="width: 45%;">Task</th>
                <th style="width: 15%; text-align: center;">Priority</th>
                <th style="width: 15%;">Created</th>
              </tr>
            </thead>
            <tbody>
              ${tasksListHtml}
            </tbody>
          </table>
        </div>
        <div class="footer">
          This is an automated report from <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">TimeTrack App</a>.<br/>
          Manage your tasks and track your time efficiently.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"TimeTrack" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `📋 Daily Task Update: ${tasks.length} Pending Tasks`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`Failed to send email to ${toEmail}:`, err.message);
    throw err;
  }
};

module.exports = {
  sendPendingTasksEmail,
};
