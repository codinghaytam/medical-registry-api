import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import cors from 'cors';
import * as dotenv from 'dotenv';
// Load environment variables first
dotenv.config();
// Validate environment configuration
import { getEnvironmentConfig, logConfiguration } from './utils/config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Validate and get configuration
const config = getEnvironmentConfig();
const app = express();
// Log configuration (with secrets masked)
if (config.NODE_ENV === 'development') {
    logConfiguration(config);
}
// CORS middleware
app.use(cors({
    origin: config.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
    credentials: true
}));
// view engine setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Serve files from images directory
app.use('/uploads', express.static(path.join(__dirname, '../upload')), function (req, res, next) {
});
import usersRouter from './routes/users.js';
import medecinRouter from './routes/medecin.js';
import etudiantRouter from './routes/etudiant.js';
import adminRouter from './routes/admin.js';
import patientRouter from './routes/patient.js';
import consultationRouter from './routes/consultation.js';
import diagnostiqueRouter from './routes/diagnostique.js';
import actionsRouter from './routes/actions.js';
import seanceRouter from './routes/seance.js';
import enumRouter from './routes/enums.js';
import reevaluationRouter from './routes/reevaluation.js';
import passwordChangeRouter from './routes/passwordChange.js';
import verifyEmailRouter from './routes/verifyEmail.js';
app.use('/users', usersRouter);
app.use('/medecin', medecinRouter);
app.use('/etudiant', etudiantRouter);
app.use('/admin', adminRouter);
app.use('/patient', patientRouter);
app.use('/consultation', consultationRouter);
app.use('/diagnostique', diagnostiqueRouter);
app.use('/actions', actionsRouter);
app.use('/seance', seanceRouter);
app.use('/enum', enumRouter);
app.use('/reevaluation', reevaluationRouter);
app.use('/password-change', passwordChangeRouter);
app.use('/verify-email', verifyEmailRouter);
// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});
// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: req.app.get('env') === 'development' ? err : {}
    });
});
const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Images directory serving at /uploads`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
});
export default app;
