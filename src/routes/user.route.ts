import { Router } from "express";
const router = Router();
import { registerUser, loginUser } from '../controllers/auth.controller'
import { registerValidation } from "../middleware/register-validation";
import { loginValidation } from "../middleware/login-validation";
import { asyncWrapper } from "../middleware/asyncWrapper";
import { verify } from "../middleware/verify-token";
import { addAvatar, getAvatar } from "../controllers/user.controller";
import multer from "multer";
import { getUserNotifications } from "../controllers/notification.controller";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/avatars')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})

const upload = multer({ storage })





router.post('/register', registerValidation, asyncWrapper(registerUser)); // tested
router.post('/login', loginValidation, asyncWrapper(loginUser)); // tested
router.post('/addavatar', verify, upload.single('image'), asyncWrapper(addAvatar)); // tested
router.post('/getuseravatar', asyncWrapper(getAvatar));// tested

router.get('/getUserNotifications', verify, asyncWrapper(getUserNotifications)); // tested


export default router


