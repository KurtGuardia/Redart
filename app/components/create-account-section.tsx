"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Badge } from "@/app/components/ui/badge"

export function CreateAccountSection() {
  const [accountType, setAccountType] = useState<"venue" | "artist">("venue")

  return (
    <div className="bg-card rounded-lg shadow-md p-6">
      <div className="flex justify-center space-x-4 mb-6">
        <Button
          variant={accountType === "venue" ? "default" : "outline"}
          onClick={() => setAccountType("venue")}
          className="friendly-button"
        >
          Lugar
        </Button>
        <Button
          variant={accountType === "artist" ? "default" : "outline"}
          onClick={() => setAccountType("artist")}
          disabled
          className="friendly-button opacity-50 cursor-not-allowed"
        >
          Artista
          <Badge variant="secondary" className="ml-2 bg-accent text-accent-foreground">
            Próximamente
          </Badge>
        </Button>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        {accountType === "venue" ? (
          <>
            <div>
              <Label htmlFor="venueName" className="text-foreground">
                Nombre del Lugar
              </Label>
              <Input
                id="venueName"
                placeholder="Ingrese el nombre del lugar"
                className="bg-secondary text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="venuePhone" className="text-foreground">
                Número de Teléfono
              </Label>
              <Input
                id="venuePhone"
                placeholder="Ingrese el número de teléfono"
                type="tel"
                className="bg-secondary text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="venueAddress" className="text-foreground">
                Dirección
              </Label>
              <Input id="venueAddress" placeholder="Ingrese la dirección" className="bg-secondary text-foreground" />
            </div>
            <div>
              <Label htmlFor="venueDescription" className="text-foreground">
                Descripción
              </Label>
              <Textarea
                id="venueDescription"
                placeholder="Describa su lugar"
                className="bg-secondary text-foreground"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="artistName" className="text-foreground">
                Nombre del Artista
              </Label>
              <Input
                id="artistName"
                placeholder="Ingrese su nombre"
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
            <div>
              <Label htmlFor="artistId" className="text-foreground">
                Número de Identificación
              </Label>
              <Input
                id="artistId"
                placeholder="Ingrese su número de ID"
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
            <div>
              <Label htmlFor="artistPhone" className="text-foreground">
                Número de Celular
              </Label>
              <Input
                id="artistPhone"
                placeholder="Ingrese su número de celular"
                type="tel"
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
            <div>
              <Label htmlFor="artistType" className="text-foreground">
                Tipo de Arte
              </Label>
              <Input
                id="artistType"
                placeholder="Ingrese su tipo de arte"
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
          </>
        )}
        <Button type="submit" className="w-full friendly-button">
          {accountType === "venue" ? "Crear Cuenta de Lugar" : "Crear Cuenta de Artista"}
        </Button>
      </form>
    </div>
  )
}

