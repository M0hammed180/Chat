const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/upload");
const chats = require("../controllers/chats.controller");
const verifyToken = require("../middleware/verfiyToken");

router.use(verifyToken);

router.get("/search", chats.search);

router.delete("/delete", chats.deletChat);

router.get("/", verifyToken, chats.userChats);

router.post("/", chats.makeChat);

router.post("/addgroup", upload.single("photo"), chats.makeGroup);

router.post("/addusertogroup", chats.addUserToGroup);

router.post("/removeUserFromGroup", chats.removeUserFromGroup);

router.post("/exitUserFromGroup", chats.exitUserFromGroup);

router.post("/showchat", chats.showChat);

router.post("/showgroup", chats.showGroup);
router.post("/editgroup", upload.single("photo"), chats.EditGroup);

module.exports = router;
