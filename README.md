# How to install

```bash
npm install
```

# How to use

```bash
node build-theme <theme-name> <frontend-name> <icon-pack-name>
```

Example:

```bash
node build-theme PS-modern spruceos ic-squares-monochrome
```

With optional 720p assets:

```bash
node build-theme PS-modern spruceos ic-squares-monochrome --720p
```

Build a single palette:

```bash
node build-theme PS-modern spruceos ic-squares-monochrome --palette deep-blue
```

Options can be combined:

```bash
node build-theme PS-modern spruceos ic-squares-monochrome --palette deep-blue --720p
```
