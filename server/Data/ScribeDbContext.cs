using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

public class ScribeDbContext : DbContext
{
    public string DbPath { get; }
    
    public ScribeDbContext()
    {
        var folder = Environment.SpecialFolder.LocalApplicationData;
        var path = Environment.GetFolderPath(folder);
        DbPath = Path.Join(path, "scribe.db");
    }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite($"Data Source={DbPath}");
}

public class Session
{
    public int SessionId { get; set; }
    public string JoinCode { get; set; }
    public int GameMasterId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Character
{
    public int CharacterId { get; set; }
    public int SessionId { get; set; }
    public string OwnerName { get; set; }
    public string Name { get; set; }
    public int HitPoints { get; set; }
    public int ArmorClass { get; set; }
    public List<int> AbilityScores { get; set; }
    public int ClassId { get; set; }
    public List<int> InventoryIds { get; set; }
}

public class Token
{
    public int TokenId { get; set; }
    public int SessionId { get; set; }
    public int? CharacterId { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public int MapId { get; set; }
}

public class ChatMessage
{
    public int ChatMessageId { get; set; }
    public int SessionId { get; set; }
    public string SenderName { get; set; }
    public string Content { get; set; }
    public DateTime TimeStamp { get; set; }
    public bool IsRollResult { get; set; }
}