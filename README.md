# FakeActivity

A custom Vencord plugin that lets you fake a Discord game activity with custom app names, icons, details, states, and elapsed timestamps.

## Features

* Fake any Discord game activity
* Choose Playing, Listening or Watching
* Optionally override a Larped (copied) activity with your own fields
* Set custom:

  * Application name
  * Application ID
  * Rich Presence icon
  * Details text
  * State text
  * Elapsed playtime
* Built-in searchable list of known application IDs
* Toggle activity directly from the Vencord toolbox
* Live updates without restarting Discord

## Preview

Examples of what you can fake:

* Playing Minecraft
* Playing Counter-Strike 2
* Playing Valorant
* Playing custom/private games
* Simulated Rich Presence timers

## Installation

1. Clone your Vencord fork
2. Place the plugin folder inside:

```txt
src/userplugins/FakeActivity
```

3. Rebuild Vencord

## Usage

1. Open Discord
2. Open Vencord settings
3. Navigate to the FakeActivity plugin
4. Click **Open Fake Activity Settings**
5. Configure:

   * App Name
   * App ID
   * Details
   * State
   * Elapsed Time
6. Enable the activity toggle

You can also toggle Fake Activity directly from the toolbox menu.

## Notes

* Rich Presence icons require a valid Discord application ID.
* Invalid application IDs may not display icons correctly.
* Elapsed time starts counting from the configured timestamp when enabled.

## Example Application IDs

| Game             | Application ID        |
| ---------------- | --------------------- |
| Minecraft        | `356875570916753438`  |
| Valorant         | `700136079562375258`  |
| Counter-Strike 2 | `1069647130261528636` |
| Fortnite         | `432980957394370572`  |

## Credits

Built for Vencord.
