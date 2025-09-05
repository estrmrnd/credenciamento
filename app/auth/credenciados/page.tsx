"use client";

import CredencialPrint from "@/app/credencialPrint";
import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { Printer } from "lucide-react";
import router from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { auth, db } from "../../../lib/firebase";
import { Card } from "../../../src/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";

type Credenciado = {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  empresa: string;
  tipoPessoa: string;
  funcao: string;
  observacao: string;
  telefone: string;
  qtdColaboradores: string;
  dataCredenciamento?: string;
  checkInAt?: string;
};

export default function CredenciadosPage() {
  const [dados, setDados] = useState<Credenciado[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState<"all" | string>("all");
  const [ordenacao, setOrdenacao] = useState<"asc" | "desc">("asc");
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [selecionado, setSelecionado] = useState<Credenciado | null>(null);

  // estados de check-in
  const [modalCheckIn, setModalCheckIn] = useState<Credenciado | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const printRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  function exportarExcel() {
    const worksheetData = dadosOrdenados.map((item) => ({
      Nome: item.nome,
      Email: item.email,
      CPF: item.cpf,
      Empresa: item.empresa,
      Sou: item.tipoPessoa,
      Função: item.funcao,
      Observação: item.observacao,
      Telefone: item.telefone,
      "Data Credenciamento": item.dataCredenciamento
        ? new Date(item.dataCredenciamento).toLocaleString("pt-BR")
        : "",
      "Check-in": item.checkInAt
        ? new Date(item.checkInAt).toLocaleString("pt-BR")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credenciados");
    XLSX.writeFile(workbook, "credenciados.xlsx");
  }

  async function fetchCredenciados(
    setDados: React.Dispatch<React.SetStateAction<Credenciado[]>>
  ) {
    const snapshot = await getDocs(collection(db, "credenciados"));

    type CredenciadoFirestore = {
      nome?: string;
      email?: string;
      cpf?: string;
      empresa?: string;
      telefone?: string;
      qtdColaboradores?: string;
      tipoPessoa?: string;
      funcao?: string;
      observacao?: string;
      createdAt?: Timestamp;
      checkInAt?: Timestamp;
      [key: string]: string | Timestamp | undefined;
    };

    const lista: Credenciado[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as CredenciadoFirestore;

      const createdAtFormatted =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt as string) || "";

      lista.push({
        id: docSnap.id,
        nome: data.nome || "",
        email: data.email || "",
        cpf: data.cpf || "",
        empresa: data.empresa || "",
        telefone: data.telefone || "",
        tipoPessoa: data.tipoPessoa || "",
        funcao: data.funcao || "",
        observacao: data.observacao || "",
        qtdColaboradores: data.qtdColaboradores || "",
        dataCredenciamento: createdAtFormatted,
        checkInAt: data.checkInAt
          ? data.checkInAt.toDate().toISOString()
          : undefined,
      });
    });
    setDados(lista);
  }

  useEffect(() => {
    fetchCredenciados(setDados);
  }, []);

  const empresasUnicas = useMemo(() => {
    const setEmpresas = new Set<string>();
    dados.forEach((item) => {
      if (item.empresa) setEmpresas.add(item.empresa);
    });
    return Array.from(setEmpresas).sort();
  }, [dados]);

  const dadosFiltrados = useMemo(() => {
    return dados.filter((item) => {
      const texto = filtroTexto.toLowerCase();
      const textoMatch =
        item.nome.toLowerCase().includes(texto) ||
        item.email.toLowerCase().includes(texto) ||
        item.empresa.toLowerCase().includes(texto);
      const empresaMatch =
        filtroEmpresa === "all" ? true : item.empresa === filtroEmpresa;
      return textoMatch && empresaMatch;
    });
  }, [dados, filtroTexto, filtroEmpresa]);

  const dadosOrdenados = useMemo(() => {
    const lista = [...dadosFiltrados];
    lista.sort((a, b) =>
      ordenacao === "asc"
        ? a.nome.localeCompare(b.nome)
        : b.nome.localeCompare(a.nome)
    );
    return lista;
  }, [dadosFiltrados, ordenacao]);

  const totalPaginas = Math.ceil(dadosOrdenados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const paginaDados = dadosOrdenados.slice(inicio, fim);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroTexto, filtroEmpresa, itensPorPagina, ordenacao]);

  // logout (mantido, caso queira usar num botão futuramente)
  async function _handleLogout() {
    try {
      await signOut(auth);
      router.push("/entrar");
    } catch (error) {
      console.error(error);
    }
  }

  // check-in com validação de mesmo dia
  async function fazerCheckIn(credenciado: Credenciado) {
    setLoading(true);
    setMensagem(null);

    try {
      if (credenciado.checkInAt) {
        const checkinDate = new Date(credenciado.checkInAt);
        const today = new Date();

        const mesmoDia =
          checkinDate.getDate() === today.getDate() &&
          checkinDate.getMonth() === today.getMonth() &&
          checkinDate.getFullYear() === today.getFullYear();

        if (mesmoDia) {
          setMensagem(
            `Este credenciado já fez check-in hoje às ${checkinDate.toLocaleTimeString(
              "pt-BR"
            )}.`
          );
          setLoading(false);
          return;
        }
      }

      const docRef = doc(db, "credenciados", credenciado.id);
      const agora = new Date();
      await updateDoc(docRef, {
        checkInAt: Timestamp.fromDate(agora),
      });

      setMensagem(`Check-in realizado com sucesso para ${credenciado.nome}!`);

      setDados((prev) =>
        prev.map((d) =>
          d.id === credenciado.id ? { ...d, checkInAt: agora.toISOString() } : d
        )
      );

      setModalCheckIn(null);
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao registrar check-in. Tente novamente.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 mb-[5vh] px-4">
      <h1 className="text-3xl font-bold mb-6">Lista de Credenciados</h1>

      {/* filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-6 space-y-4 md:space-y-0">
        <input
          type="text"
          placeholder="Filtrar por nome, email ou empresa"
          className="flex-grow p-2 border rounded dark:bg-gray-800 dark:text-white"
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.target.value)}
        />

        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger className="cursor-pointer w-[200px]">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {empresasUnicas.map((empresa) => (
              <SelectItem key={empresa} value={empresa}>
                {empresa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(itensPorPagina)}
          onValueChange={(value) => setItensPorPagina(Number(value))}
        >
          <SelectTrigger className="cursor-pointer w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50].map((num) => (
              <SelectItem key={num} value={String(num)}>
                {num} por página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ordenacao}
          onValueChange={(value) => setOrdenacao(value as "asc" | "desc")}
        >
          <SelectTrigger className="cursor-pointer w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Nome A-Z</SelectItem>
            <SelectItem value="desc">Nome Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end mb-4">
        <Button className="cursor-pointer" onClick={exportarExcel}>
          Exportar Excel
        </Button>
      </div>

      {/* lista */}
      {paginaDados.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Nenhum credenciado encontrado.
        </p>
      ) : (
        <div className="space-y-4">
          {paginaDados.map((item) => (
            <Card
              key={item.id}
              className="flex justify-between items-center p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div>
                <p>
                  <strong>Nome:</strong> {item.nome}
                </p>
                <p>
                  <strong>Email:</strong> {item.email}
                </p>
                <p>
                  <strong>CPF:</strong> {item.cpf}
                </p>
                <p>
                  <strong>Empresa:</strong> {item.empresa}
                </p>
                <p>
                  <strong>Sou:</strong> {item.tipoPessoa}
                </p>
                <p>
                  <strong>Função:</strong> {item.funcao}
                </p>
                <p>
                  <strong>Observação</strong> {item.observacao}
                </p>
                <p>
                  <strong>Telefone:</strong> {item.telefone}
                </p>
                {item.dataCredenciamento ? (
                  <p>
                    <strong>Data Credenciamento:</strong>{" "}
                    {new Date(item.dataCredenciamento).toLocaleDateString()}
                  </p>
                ) : (
                  <p>
                    <em>Data não disponível</em>
                  </p>
                )}
                {item.checkInAt ? (
                  <p>
                    <strong>Check-in:</strong>{" "}
                    {new Date(item.checkInAt).toLocaleString()}
                  </p>
                ) : (
                  <p>
                    <em>Sem check-in</em>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSelecionado(item);
                    setTimeout(() => handlePrint(), 100);
                  }}
                >
                  <Printer className="h-5 w-5" />
                </Button>
                <Button
                  className="cursor-pointer"
                  onClick={() => {
                    setMensagem(null);
                    setModalCheckIn(item);
                  }}
                >
                  Check-in
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* paginação */}
      {totalPaginas > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual((prev) => prev - 1)}
          >
            Anterior
          </button>
          <p className="dark:text-gray-300">
            Página {paginaAtual} de {totalPaginas}
          </p>
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual((prev) => prev + 1)}
          >
            Próxima
          </button>
        </div>
      )}

      {/* impressão escondida */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>
          {selecionado && (
            <CredencialPrint
              nome={selecionado.nome}
              empresa={selecionado.empresa}
              funcao={selecionado.funcao}
            />
          )}
        </div>
      </div>

      {/* modal check-in */}
      <Dialog
        open={!!modalCheckIn}
        onOpenChange={(open) => {
          if (!open) {
            setModalCheckIn(null);
            setMensagem(null);
            fetchCredenciados(setDados);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalCheckIn ? `Check-in de ${modalCheckIn.nome}` : "Check-in"}
            </DialogTitle>
          </DialogHeader>

          {modalCheckIn && (
            <div className="space-y-3">
              <p>
                <strong>CPF:</strong> {modalCheckIn.cpf}
              </p>
              <p>
                <strong>Email:</strong> {modalCheckIn.email}
              </p>
              <p>
                <strong>Empresa:</strong> {modalCheckIn.empresa}
              </p>
              <p>
                <strong>Telefone:</strong> {modalCheckIn.telefone}
              </p>

              <Button
                className="cursor-pointer"
                onClick={() => fazerCheckIn(modalCheckIn)}
                disabled={loading}
              >
                {loading ? "Registrando..." : "Confirmar Check-in"}
              </Button>

              {mensagem && (
                <p className="text-center text-green-600 mt-2">{mensagem}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
