require("dotenv").config()

const util = require("util");
const { spawn, exec } = require('child_process');
const execute = util.promisify(exec);

const AWS = {
	s3: {
		summarize(path) {
			return new Promise(async (resolve, reject) => {
				let cmd = spawn("aws", `s3 ls ${path} --summarize --recursive --endpoint=${process.env.AWS_ENDPOINT}`.split(" "));
				let out = { ext: {}, items: 0 };

				// error handling
				cmd.on("error", err => reject(err));

				cmd.stdout.on("data", chunk => {
					let text = chunk.toString(),
						lines = text.split("\n");

					lines.map(line => {
						let type = line.slice(line.lastIndexOf(".") + 1);
						if (line.slice(-1) === "/" || line.indexOf(".") < 0 || !type) return;
						out.ext[type] = out.ext[type] ? out.ext[type] + 1 : 1;
						out.items++;
					});

					if (~text.indexOf("Total Size")) {
						out.size = +text.match(/Total Size: (\d{1,})/im)[1];
						resolve(out);
					}
				});
			});
		},
		exec(cmd) {
			let command = `aws s3 ${cmd} --endpoint=${process.env.AWS_ENDPOINT}`;
			return new Promise(async (resolve, reject) => {
				const { stdout, stderr } = await execute(command);
				if (stderr) return reject(stderr)
				resolve(stdout);
			});
		}
	}
}

module.exports = {
	AWS,
}
