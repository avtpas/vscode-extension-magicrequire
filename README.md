# magic-require README

# Require
1. new file `magicrequire.json` at root path
2. fullfill the config like below

```json
  {
    "alias": {
      "~": "." // depends on your own settings
    },
    "exclude": [
      "node_modules",
      "dist",
      "bin",
      "build",
      "test"
    ],
    "include": [
      "js",
      "ts",
      "jsx",
      "tsx",
      "vue"
    ]
  }
`

# USAGE

1. open your file
2. find a place to insert the script
3. press `shift`+`command`+`p` to call command selector
4. type the key words `magicrequire` or `mr` for short to find this very one
5. follow the tips it says

## First Version
with this extension you can easily add import or require script to your own file

these situations has been well resolved
### default
`import react from 'react';`
`import doc from '../../doc';`
### with alias
`import MyModule from '~/client/MyModule'`

generate settings with magicrequire.json to config the alias and other configs

**Enjoy!**

**or help me improve it** 
