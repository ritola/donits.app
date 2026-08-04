# Repository support

**Donits.app** supports the following remote repositories and authentication methods.

## Git

| Supported | Protocol         | Authentication           | Services |
|:---------:|------------------|--------------------------|----------|
| Yes       | HTTP(S)          | GitHub App / Device Flow | GitHub   |
| No        | SSH              | -                        |          |
| No        | Local filesystem | -                        |          |

Services list may not be complete. Please let us know the instructions how you managed to connect to your service.

### GitHub

#### Github App

Only the Device Flow is currently supported.

To authenticate for a GitHub App using the Device Flow, follow these steps:

1. Add repository URL
2. Enter the given device code to the GitHub device code page
3. You can close the device code page after the code has been entered
