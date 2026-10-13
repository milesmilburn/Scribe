using System.Collections.Concurrent;

public class PresenceTracker
{
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, string>> _sessions = new();

    public void Add(string code, string connId, string name) =>
        _sessions.GetOrAdd(code, _ => new()).TryAdd(connId, name);

    public void Remove(string code, string connId)
    {
        if (_sessions.TryGetValue(code, out var users)) users.TryRemove(connId, out _);
    }

    public string[] List(string code) =>
        _sessions.TryGetValue(code, out var users) ? users.Values.ToArray() : [];
}