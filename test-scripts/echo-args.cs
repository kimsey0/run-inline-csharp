// Echo command-line arguments
Console.WriteLine($"Received {args.Length} arguments:");

for (int i = 0; i < args.Length; i++)
{
    Console.WriteLine($"  [{i}] = {args[i]}");
}

if (args.Length == 0)
{
    Console.WriteLine("  (none)");
}
