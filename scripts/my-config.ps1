# Configuration generee le 07/31/2025 01:18:51
function Get-EnvConfig {
    param([string]$Environment)
    switch ($Environment.ToLower()) {
        "prod" { 
            return @{
                Host = "localhost"
                Database = "loft_prod"
                User = "postgres"
                Port = "5432"
            }
        }
        "test" { 
            return @{
                Host = "localhost"
                Database = "loft_test"
                User = "postgres"
                Port = "5432"
            }
        }
    }
}
