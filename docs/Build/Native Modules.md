# Native Modules

> **Warning**
> 
> This is a new and experimental feature. It will heavily slow down your web app start time since the module always needs to be installed prior to running. Please try to use only js modules. Native modules are modules with `.node` files which must be installed per operating system and architecture.

Native nodejs modules are only available for your Server files. It can not be bundled within your frontend since web browser are not able to interpret native code<sup>*</sup>. 

To define those modules, simply create a `server/native.json` file with this format :

```json
{
    "native-module": "version"
}
```

This tells FullStacked to NOT bundle this module and install it right before running.

<sup>*</sup>Maybe some day will be able to easily import `.node` modules with WASM, but let's consider like we can not for now.


