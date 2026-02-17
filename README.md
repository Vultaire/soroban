# soroban: Paul's Soroban practice tools

This is the source code for the soroban tool(s) hosted at https://www.vultaire.net/soroban/.

# License

GPL v3.  See [LICENSE.txt](./LICENSE.txt) for the full license text.

# How to build

During development:

```
npm run dev
```

For builds:

```
# Build for production
npm run install

# Run production locally to test
npm run preview
```

# Deploying

Builds are built to the `build` directory; the contents of this directory can
be copied to any standard web server which serves static files.  These files
are assumed to be served via the "/soroban" path of a web server.

As this is intended to run on GitHub Pages, server-side rendering is explicitly
turned off.

If you also decide to deploy this to GitHub Pages, you will need to ensure your
repo includes a `.nojekyll` file if using default workflows for publishing, else
the `_app` directory within the build will not be included in the build by
GitHub.

# Why?

I'm taking soroban classes as a form of mental training, and out of curiosity
for how far I can develop such skills.

One homework exercise I was given was to ask a family member to read some of
the problems aloud to me so I could perform them without reading the full
question at once.  As my family is quite busy and as I have been working
through the class material very quickly (and generating lots of homework
exercises to work through), this quickly became a bit too much to ask family
to do.  And while I *could* just record these exercises myself, I was curious
if I could write an app which could help me.

The base version of this took a bit longer than expected - I basically took a
day of free time out of my weekend to ramp on Svelte and SvelteKit - but the
result seems a relatively easy to use and reuse app for this type of purpose.
And it may get further improvements if I see a need.

# What?

The current version of this is a soroban "yomiage" tool: given a simple
addition/subtraction problem, I wanted the tool to read it aloud for me.

By the time you read this, likely it will have "edit" and "study" modes:

## Edit mode

Enter problems one-at-a-time into the editor.  Press "Enter" to jump to the
next input box, or to create a new one if actively working in the last one.

As you input problems, the active URL is updated.  You can bookmark the URL
to re-open later with the same problems, or share the URL to open on a
different device.

## Study mode

Coming soon...