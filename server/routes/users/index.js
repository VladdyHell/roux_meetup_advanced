const express = require('express');
const passport = require('passport');
const UserModel = require('../../models/UserModel');
const UserService = require('../../services/UserService');
const middlewares = require('../middlewares');

const util = require('util');
const url = require('url');

const protectedRoutes = ['/users/account'];

const router = express.Router();

function redirectIfLoggedIn(req, res, next) {
  if (req.user) return res.redirect('/users/account');

  return next();
}

module.exports = (params) => {
  const { avatars } = params;
  router.get('/login', redirectIfLoggedIn, (req, res) =>
    res.render('users/login', { error: req.query.error })
  );

  router.post(
    '/login',
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/users/login?error=true',
    })
  );

  router.get('/logout', async (req, res, next) => {
    const isPromisified = false;
    false && console.log(req.get('referer'));
    false && console.log(req.rawHeaders[11]);
    false && console.log(req.headers.referer);
    const legacyPath = url.parse(req.get('referer')).path;
    const stablePath = new URL(req.get('referer')).pathname;
    const currentURL = req.query.currentURL;
    const pathToTest = new RegExp('^' + currentURL + '|' + stablePath + '$');
    const logoutUser = util.promisify(req.logout);

    if (isPromisified) {
      try {
        await logoutUser();
        if (protectedRoutes.some((route) => pathToTest.test(route))) {
          return res.redirect('/users/login');
        }
        res.redirect(stablePath);
      } catch (e) {
        return next(e);
      }
    } else {
      req.logout(() => {
        console.log(
          protectedRoutes.some(
            (route) => pathToTest.test(route)
          )
        );
        if (protectedRoutes.some((route) => pathToTest.test(route))) {
          return res.redirect('/users/login');
        }
        res.redirect(stablePath);
      });
    }
  });

  router.get('/registration', redirectIfLoggedIn, (req, res) =>
    res.render('users/registration', { success: req.query.success })
  );
  router.post(
    '/registration',
    middlewares.upload.single('avatar'),
    middlewares.handleAvatar(avatars),
    async (req, res, next) => {
      try {
        const { username, email, password } = req.body;

        const savedUser = await UserService.createUser(
          username,
          email,
          password,
          req.file ? req.file : null,
          req.file && req.file.storedFilename ? req.file.storedFilename : null
        );
        // console.log(savedUser);
        if (savedUser) return res.redirect('/users/registration?success=true');

        throw new Error('Failed to save user for unknown reasons');
      } catch (e) {
        if (req.file && req.storedFilename) {
          await avatars.delete(req.file.storedFilename);
        }
        return next(e);
      }
    }
  );

  router.get(
    '/account',
    (req, res, next) => {
      if (req.user) return next();

      // return res.status(401).end();
      // return res.status(403).end();
      return res.redirect('/users/login');
    },
    (req, res) => res.render('users/account', { user: req.user })
  );

  router.get('/avatar/:filename', (req, res) => {
    res.type('png');
    return res.sendFile(avatars.filepath(req.params.filename));
  });

  router.get('/avatartn/:filename', async (req, res) => {
    res.type('png');
    const tn = await avatars.thumbnail(req.params.filename);
    return res.end(tn, 'binary');
  });

  return router;
};
