terraform {
  backend "gcs" {
    bucket = "tfstate-malafaareh-481713-luxe"
    prefix = "terraform/state"
  }
}
