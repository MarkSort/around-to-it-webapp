# Around To It

A basic task list app using TypeScript, React, and IndexedDB.  Currently it does not sync data outside of the current browser and the layout is only ideal for mobile device in portrait rotation.

## Try It

[https://aroundtoit.marksort.com/](https://aroundtoit.marksort.com/)

## Running

``` bash
npm install
./build-dev.sh
./serve.sh
```

Then browse to `http://localhost:8000/`.

The `--openssl-legacy-provider` option in `build-dev.sh` is currently required because this was written against older packages that now depend on an insecure openssl version.  This should be OK in this case because building the JavaScript bundle should only use local data.

## TODO
- remove the need for the `--openssl-legacy-provider` option
- other package updates
- more recurrence options (weekly, monthly, yearly, rrule-like, ???)
- sync - probably in a local-first manner
- desktop layout
