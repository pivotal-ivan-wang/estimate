installing chrome plugin:
1. chrome://extensions/
2. check 'Developer mode'
3. 'Load unpacked extension...'
4. select 'chrome' directory

deploying app to heroku:

```
git push heroku `git subtree split --prefix app master`:master
```

running app:

```
heroku open
```

running tests:

```
cd app
jasmine
```
