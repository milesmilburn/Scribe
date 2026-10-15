using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Scribe.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTokenModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Tokens",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "Tokens",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "Tokens");

            migrationBuilder.DropColumn(
                name: "Label",
                table: "Tokens");
        }
    }
}
