const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chat-app",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//       Date.now() +
//         "-" +
//         Math.round(Math.random() * 1e9) +
//         path.extname(file.originalname),
//     );
//   },
// });
const upload = multer({ storage, limits: { fieldSize: 5 * 1024 * 1024 } });
module.exports = { upload };
