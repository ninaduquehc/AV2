import * as os from "os";
import * as path from "path";

process.env.DATA_DIR ??= path.join(os.tmpdir(), `greencode_test_${Date.now()}`);