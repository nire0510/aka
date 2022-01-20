# AKA

###### Alias Bash Command on Steroids

A Bash `alias` is essentially nothing more than a keyboard shortcut, an abbreviation,
a means of avoiding typing a long command sequence.
It's because of these reasons that **AKA** provides a better alternative to the good ol' `alias` command:
- Aliases are stored as files on your file system and hence can be easily shared and synchronized between your computers
- AKA is cross-platform, which means it can be be used on your Linux, MacOS or Windows OS based machines
- It comes with some advance & handy features, such as: search, dynamic parameters and more

### Migrating to V1
The latest version has gone through some major changes, and hence is not compatible with aliases which were created with older versions of AKA.
If you choose to upgrade to the new version, please make sure you backup your aliases folder and then run the following command:
`aka --migrate`

### Installation
`npm install -g as-known-as`

### Usage
`Usage: aka [options] [command]`

### Commands
* `add [options] <alias> <command>` - add a new alias or update existing one
* `copy|cp [options] <from> <to>`   - copy an existing alias
* `execute|ex [options] <alias>`    - execute an alias
* `list|ls [options] [filter]`      - show all aliases
* `move|mv [options] <from> <to>`   - rename an alias and/or update its description
* `remove|rm <alias...>`            - remove a one or more aliases

### Options
`-C, --chdir <path>`  change the aliases directory
`-h, --help`          output usage information
`-m, --migrate`       migrate aliases from pre 1.0.0 versions of as-known-as
`-V, --version`       output the version number
`-w, --website`       open AKA website

### Index
* `<...>` - mandatory value
* `[...]` - optional value

### Examples
* `aka add my-ip "dig +short myip.opendns.com @resolver1.opendns.com" -d "get my public ip address"` - adds a new **my-ip** alias with description. Description & command should be surrounded with quotes.
* `aka ls ip` - searches for all aliases which contains **ip** in either alias or description.
* `aka ex my-ip` - execute **my-ip** alias (you can also omit the `ex` if no options specified).
* `aka rm my-ip` - removes all aliases.
* `aka --chdir /Users/nir/Dropbox/aka` - changes **AKA** aliases directory.

### Advanced Usage
1. **Dynamic command parameters** - Use command option -p to leave out parameters which you want to add dynamically, for example:
`aka add ls "ls -la" -d "display folder content as a list"` and then use as follows:
    `aka ex ls -p "some-path"`
2. **Dynamic command parameters binding** - Parameters binding makes it even easier to execute aliases, by providing help and even set of valid options, for example:
`aka scale-image="convert {{Source image path?|input}} -resize {{Scale rate (in percents)?|input}} {{Scaled image path?|input}}"
    -d "scale an image proportionally"`
     and then the use as follows:
    `aka ex scale-image`

  Dynamic command parameters binding format:
    - `{{description|type[|options]}}`
    - **description** - short parameter description
    - **type** - can be one of the following:    
      * `input` for free text  
      * `password` for masked text  
      * `list` for predefined list of valid options  
      * `confirm` for specific value  
      (see **options** for more info)  
    - **options**  
      * `list` - semicolon separated list of strings  
      * `confirm` - a value which will be appended to the command in case of confirmation  
      * `input`, `password` - default value if empty  

### Tips & Tricks
* Call any of the commands with `-h` parameter to see its help
* Always use absolute paths (avoid shortcuts symbols such as ~, .. etc)
* You do not have to remember command's exact alias. If no command with the exact alias was found, similar options will be displayed
* Change **AKA** aliases directory to Dropbox, Google Drive or any other online storage service, to share your aliases
    with all your workstations
* If you get **EACCES: permission denied** error on first run, either run as sudo (only once),
    or change your global `node_modules` directory to a path you have **write** access to
* If you get **Permission denied (publickey)** error while running ssh command, make sure your public key path is
absolute (i.e. do not start path with tilde ~)
* Notice that if a command contains pipes, it will run in EXEC mode, which basically means it's output is limited to 200KB
