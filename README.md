# N2WVectorStream
Vector watch stream that shows your Android unread notification icons

** Android only, requires Notif2Watch app running , which is a paid Android app **

Get a glimpse of your unread notifications at any time with N2W stream, you'll always see which Android apps have notifications waiting for you. Whenever possible, N2W stream will try to use an icon instead of an app name, but icons available are limited, so some apps will show their name instead (or a recognizable shorter name, like 'in' for 'LinkedIn'). For example, if you have notifications from Facebook, LinkedIn, Slack and GMail in your notification drawer, your N2W stream will show something like this :
f in # M

(Note that 'f' in this example will actually be a real Facebook icon as the icon for Facebook is made available by Vector)

There is a slight delay from when you get a new notification on phone until it actually shows on the stream, this is the push notification from Vector server to your watch that is delayed a bit. I can't do anything about it, but from my testing it's only a few seconds.


Requirements :</br>
1) Create an account on Cloudant.com, their free tier will not charge you for the first 50$/month.</br>
2) In Cloudant dashboard, create a new database and name it what you want.</br>
3) In your database permissions in Cloudant dashboard, create a new API key and take note of the key and password. Give _reader and _writer permissions to this API key.</br>
4) Create a developer account on developer.vectorwatch.com</br>
5) Create a new stream and name it what you want.</br>
6) Copy paste all code in Love.js from this repository to your stream code.</br>
7) Change <code>var cloudantUrl = 'your_own_cloudant_database_url';</code> with your own database url.</br>
8) Change <code>apiKeyUser</code> and <code>apiKeyPassword</code> with the API key and password you noted at step 3.</br>


Alternatively, you can replace Cloudant.com usage by using StorageProvider to store data.
