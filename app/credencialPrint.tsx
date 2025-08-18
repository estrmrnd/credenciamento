// import React from "react";

// interface Props {
//   nome: string;
//   empresa: string;
// }

// const credencialPrint: React.FC<Props> = ({ nome, empresa }) => {
//   return (
//     <div className="credencial">
//       <h2>{nome}</h2>
//       <p>{empresa}</p>
//       <style jsx>{`
//         @media print {
//           @page {
//             size: 9cm 5cm; /* largura x altura */
//             margin: 0;
//           }
//           body {
//             margin: 0;
//           }
//           .credencial {
//             width: 9cm;
//             height: 5cm;
//             display: flex;
//             flex-direction: column;
//             justify-content: center;
//             align-items: center;
//             border: 1px solid black;
//             font-size: 16px;
//             text-align: center;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default credencialPrint;
import React from "react";

interface Props {
  nome: string;
  empresa: string;
  tipoPessoa: 'pessoaFisica' | 'empresa' | 'colaborador'; // <- adicionado
}

const CredencialPrint: React.FC<Props> = ({ nome, empresa, tipoPessoa }) => {
  // traduzindo o tipoPessoa para exibição
  const tipoExibicao =
    tipoPessoa === 'pessoaFisica'
      ? 'Pessoa Física'
      : tipoPessoa === 'empresa'
      ? 'Empresa'
      : 'Colaborador';

  return (
    <div className="credencial">
      <h2>{nome}</h2>
      <p>{empresa}</p>
      <p>{tipoExibicao}</p> {/* <- exibindo o tipoPessoa */}
      <style jsx>{`
        @media print {
          @page {
            size: 9cm 5cm; /* largura x altura */
            margin: 0;
          }
          body {
            margin: 0;
          }
          .credencial {
            width: 9cm;
            height: 5cm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border: 1px solid black;
            font-size: 16px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CredencialPrint;
