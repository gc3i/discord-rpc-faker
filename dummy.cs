using System;
using System.Drawing;
using System.Windows.Forms;

namespace GameLauncher {
    static class Program {
        [STAThread]
        static void Main(string[] args) {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string title = "Game";
            if (args.Length > 0 && !string.IsNullOrEmpty(args[0])) {
                title = args[0];
            }

            int durationSeconds = 300;
            if (args.Length > 1) {
                int s;
                if (int.TryParse(args[1], out s)) durationSeconds = s;
            }

            Form form = new Form();
            form.Text = title;
            form.Size = new Size(360, 160);
            form.StartPosition = FormStartPosition.CenterScreen;

            Label label = new Label();
            label.Text = title + "\n\n(Running in background)";
            label.Dock = DockStyle.Fill;
            label.TextAlign = ContentAlignment.MiddleCenter;
            label.Font = new Font("Segoe UI", 10, FontStyle.Regular);
            form.Controls.Add(label);

            var timer = new System.Windows.Forms.Timer();
            timer.Interval = Math.Max(1000, durationSeconds * 1000);
            timer.Tick += delegate(object sender, EventArgs e) {
                Application.Exit();
            };
            timer.Start();

            Application.Run(form);
        }
    }
}
