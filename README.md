# Run Inline C# - Azure DevOps Extension

Run C# code directly in your Azure DevOps pipeline using .NET 10's file-based programs feature. Supports both inline scripts and .cs files with NuGet package directives.

## Features

- **Inline C# Scripts**: Write C# code directly in your pipeline YAML
- **File-based Scripts**: Execute .cs files from your repository
- **NuGet Package Support**: Use `#:package` directives for dependencies
- **Environment Variables**: Pass custom environment variables to your scripts
- **Flexible Arguments**: Pass command-line arguments to your C# code
- **Error Handling**: Option to fail on stderr output

## Requirements

- .NET 10 SDK or later installed on the build agent
- Azure DevOps Services or Azure DevOps Server 2020+

## Installation

1. Install the extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com)
2. The task will be available as "Run Inline C#" in your pipeline editor

## Usage

### Inline Script

```yaml
- task: RunInlineCSharp@1
  displayName: 'Run C# Script'
  inputs:
    script: |
      Console.WriteLine("Hello from inline C#!");
      var numbers = Enumerable.Range(1, 10);
      Console.WriteLine($"Sum: {numbers.Sum()}");
```

### File-based Script

```yaml
- task: RunInlineCSharp@1
  displayName: 'Run C# File'
  inputs:
    scriptType: 'filePath'
    scriptPath: 'scripts/build-helper.cs'
    arguments: '$(Build.SourcesDirectory)'
```

### With NuGet Packages

```yaml
- task: RunInlineCSharp@1
  inputs:
    script: |
      #:package Newtonsoft.Json@13.0.3

      using Newtonsoft.Json;

      var obj = new { Name = "Test", Value = 42 };
      Console.WriteLine(JsonConvert.SerializeObject(obj));
```

### With Environment Variables

```yaml
- task: RunInlineCSharp@1
  inputs:
    script: |
      var apiKey = Environment.GetEnvironmentVariable("API_KEY");
      Console.WriteLine($"Using API key: {apiKey?.Substring(0, 4)}...");
    environmentVariables: |
      API_KEY=$(ApiKeySecret)
      DEBUG=true
```

### With Arguments

```yaml
- task: RunInlineCSharp@1
  inputs:
    script: |
      foreach (var arg in args)
      {
          Console.WriteLine($"Argument: {arg}");
      }
    arguments: '--input file.txt --output result.json'
```

## Task Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `scriptType` | pickList | Yes | `inline` | Script type: "inline" or "filePath" |
| `script` | multiLine | Conditional | - | Inline C# code (when scriptType=inline) |
| `scriptPath` | filePath | Conditional | - | Path to .cs file (when scriptType=filePath) |
| `arguments` | string | No | - | Command-line arguments passed to the script |
| `environmentVariables` | multiLine | No | - | Environment variables (NAME=value, one per line) |
| `workingDirectory` | filePath | No | `$(System.DefaultWorkingDirectory)` | Working directory for execution |
| `failOnStderr` | boolean | No | `false` | Fail task if stderr output detected |

## Examples

### Build Version Bumper

```yaml
- task: RunInlineCSharp@1
  displayName: 'Bump Version'
  inputs:
    script: |
      var versionFile = "version.txt";
      var currentVersion = File.ReadAllText(versionFile).Trim();
      var parts = currentVersion.Split('.');
      parts[2] = (int.Parse(parts[2]) + 1).ToString();
      var newVersion = string.Join(".", parts);
      File.WriteAllText(versionFile, newVersion);
      Console.WriteLine($"##vso[task.setvariable variable=NewVersion]{newVersion}");
```

### API Health Check

```yaml
- task: RunInlineCSharp@1
  displayName: 'Check API Health'
  inputs:
    script: |
      using var client = new HttpClient();
      var response = await client.GetAsync("https://api.example.com/health");
      if (!response.IsSuccessStatusCode)
      {
          Console.Error.WriteLine($"API unhealthy: {response.StatusCode}");
          Environment.Exit(1);
      }
      Console.WriteLine("API is healthy!");
```

### File Processing with Packages

```yaml
- task: RunInlineCSharp@1
  displayName: 'Process CSV Data'
  inputs:
    script: |
      #:package CsvHelper@30.0.1

      using CsvHelper;
      using System.Globalization;

      using var reader = new StreamReader("data.csv");
      using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
      var records = csv.GetRecords<dynamic>().ToList();
      Console.WriteLine($"Processed {records.Count} records");
```

## Troubleshooting

### Script not found

Ensure the `scriptPath` is relative to the repository root or use `$(Build.SourcesDirectory)` prefix.

### NuGet packages not restoring

The .NET SDK handles package restoration automatically. Ensure the agent has internet access to nuget.org.

### Compilation errors

Check the task output for detailed C# compiler errors. The full compiler output is displayed in the pipeline logs.

### dotnet not found

Ensure .NET 10 SDK is installed on the build agent. You can use the `UseDotNet@2` task to install it:

```yaml
- task: UseDotNet@2
  inputs:
    version: '10.x'
```

## Contributing

Contributions are welcome! Please submit issues and pull requests on GitHub.

## License

MIT License - see LICENSE file for details.
