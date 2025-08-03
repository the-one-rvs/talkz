import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { mongoOP, oauthcallback, oauthduration } from "../metrics.js";



const op1 = oauthduration.startTimer({OperationType: "Looging In"})
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const op2 = mongoOP.startTimer({operation: "find_user_by_google_id", type: "findOne"})
        let user = await User.findOne({ googleid: profile.id });
        op2()
        if (!user) {
            const op3 = mongoOP.startTimer({operation: "find_user_by_email", type: "findOne"})
            user = await User.findOne({ email: profile.emails[0].value });
            op3()
            if (user && !user.googleid) {
                user.googleid = profile.id;
                await user.save();
            }
        }

        if (!user) {
            const op3 = mongoOP.startTimer({operation: "creatting_user_with_DB_data", type: "create"})
            user = await User.create({
                username: profile.emails[0].value.split("@")[0],
                email: profile.emails[0].value,
                fullname: profile.displayName,
                googleid: profile.id,
                onlyOAuth: true,
                isVerified: profile.email_verified 
            });
            op3()
        }

        if (!user) {
            return done(null, false);  
        }
        oauthcallback.inc()
        op1()
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

export default passport;